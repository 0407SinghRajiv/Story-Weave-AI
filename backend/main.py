import os
import base64
import io
import wave
import time
import asyncio
import random
import urllib.request
import urllib.parse
from typing import List, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from sarvamai import SarvamAI
from services.llm_service import (
    generate_story_from_llm, 
    generate_comic_prompts, 
    generate_story_pages
)

load_dotenv()

app = FastAPI(
    title="Story Generation API", 
    description="An API for generating stories using LLaMA 3 and Gemini 2.0", 
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global State ──────────────────────────────────────────────────────────

# Limit concurrent image requests to Pollinations to avoid 429 errors
image_semaphore = asyncio.Semaphore(1) 

# ─── Pydantic models ───────────────────────────────────────────────────────────

class StoryRequest(BaseModel):
    theme: str = Field(..., description="The main theme of the story")
    keywords: str = Field(..., description="Important keywords to include in the story")
    language: str = Field(..., description="The language the story should be written in")
    length: str = Field(..., description="The desired length of the story")
    tone: str = Field(..., description="The tone of the story")

class ComicRequest(BaseModel):
    story: str = Field(..., description="The generated story to create a comic for")
    theme: str = Field(..., description="The main theme of the story")

class StoryPagesRequest(BaseModel):
    story: str = Field(..., description="The generated story to split into pages")
    theme: str = Field(..., description="The main theme of the story")

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to convert to speech")
    language_code: str = Field(default="en-IN", description="Target language code")
    speaker: str = Field(default="anushka", description="Sarvam TTS speaker name")

# ─── Helper Functions ────────────────────────────────────────────────────────

def split_text_into_chunks(text: str, max_chars: int = 450) -> List[str]:
    """
    Split text into chunks that are safe for Sarvam AI TTS (max 500 chars).
    Handles regional language punctuation like Hindi full stops (।).
    """
    if not text:
        return []
    
    # Normalize whitespace
    text = " ".join(text.split())
    
    # Split by common sentence terminators across languages
    # English: . ! ?
    # Hindi/Regional: । ?
    # Using a regex-like split would be better, but we can do a simple replacement
    punctuations = [". ", "! ", "? ", "। ", "？ ", "\n"]
    
    # We want to keep the punctuation with the sentence
    temp_text = text
    for p in punctuations:
        temp_text = temp_text.replace(p, p + "<SPLIT>")
    
    segments = [s.strip() for s in temp_text.split("<SPLIT>") if s.strip()]
    
    chunks = []
    current_chunk = ""
    
    for seg in segments:
        if len(current_chunk) + len(seg) + 1 <= max_chars:
            current_chunk = (current_chunk + " " + seg).strip() if current_chunk else seg
        else:
            if current_chunk:
                chunks.append(current_chunk)
            
            # If a single segment is too long, we must force split it
            if len(seg) > max_chars:
                # Try splitting by space within the long segment
                words = seg.split(" ")
                sub_chunk = ""
                for word in words:
                    if len(sub_chunk) + len(word) + 1 <= max_chars:
                        sub_chunk = (sub_chunk + " " + word).strip() if sub_chunk else word
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = word
                current_chunk = sub_chunk
            else:
                current_chunk = seg
                
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

# ─── Story generation endpoint ─────────────────────────────────────────────────

@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    # Map common shorthands to canonical length strings
    length_map = {
        "micro": "Micro (~100 words)",
        "short": "Short (~500 words)",
        "medium": "Medium (~1000 words)",
        "epic": "Epic (~2500 words)"
    }
    
    canonical_length = length_map.get(request.length.lower(), request.length)
    
    # If the provided length isn't in our recognized list, we allow it but log a warning
    # This prevents strictly failing on minor variations
    valid_lengths = [
        "Micro (~100 words)", 
        "Short (~500 words)", 
        "Medium (~1000 words)", 
        "Epic (~2500 words)"
    ]
    
    if canonical_length not in valid_lengths:
        # We'll still proceed but use "Short" as a reliable default hint for the LLM
        # unless it looks like a valid custom word count.
        pass

    try:
        response = generate_story_from_llm(
            theme=request.theme,
            keywords=request.keywords,
            language=request.language,
            length=canonical_length,
            tone=request.tone,
        )
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )

# ─── Comic generation endpoint ─────────────────────────────────────────────────

@app.post("/generate-comic")
async def generate_comic(request: ComicRequest):
    try:
        response = generate_comic_prompts(
            story=request.story,
            theme=request.theme
        )
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )

# ─── Story pages generation endpoint (Pipeline) ───────────────────────────────

@app.post("/generate-story-pages")
async def generate_pipeline_pages(request: StoryPagesRequest):
    try:
        response = generate_story_pages(
            story=request.story,
            theme=request.theme
        )
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred: {str(e)}"
        )

# ─── Sarvam AI Text-to-Speech endpoint ────────────────────────────────────────

@app.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using Sarvam AI TTS and return base64 WAV audio.
    """
    sarvam_api_key = os.getenv("SARVAM_API_KEY")
    if not sarvam_api_key:
        raise HTTPException(
            status_code=500, 
            detail="SARVAM_API_KEY is not configured in the server environment."
        )

    text = request.text.strip()
    MAX_CHARS = 450

    try:
        client = SarvamAI(api_subscription_key=sarvam_api_key)

        chunks = split_text_into_chunks(text, MAX_CHARS)
        audio_parts: List[bytes] = []

        for chunk in chunks:
            if not chunk.strip():
                continue
            
            resp = client.text_to_speech.convert(
                text=chunk,
                target_language_code=request.language_code,
                speaker=request.speaker,
            )
            
            # resp.audios is a list of base64-encoded audio strings
            if hasattr(resp, 'audios'):
                for audio_b64 in resp.audios:
                    audio_parts.append(base64.b64decode(audio_b64))

        if not audio_parts:
            raise HTTPException(
                status_code=500, 
                detail="No audio returned from Sarvam AI."
            )

        # Merge all WAV chunks
        all_frames = b""
        wav_params = None

        for part in audio_parts:
            with wave.open(io.BytesIO(part), "rb") as wf:
                if wav_params is None:
                    wav_params = wf.getparams()
                all_frames += wf.readframes(wf.getnframes())

        # Write combined frames into a new in-memory WAV
        out_buffer = io.BytesIO()
        with wave.open(out_buffer, "wb") as out_wav:
            out_wav.setparams(wav_params)
            out_wav.writeframes(all_frames)

        audio_b64 = base64.b64encode(out_buffer.getvalue()).decode("utf-8")
        return {"audio_base64": audio_b64, "format": "wav"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sarvam TTS error: {str(e)}")

# ─── Image Proxy endpoint ──────────────────────────────────────────────────

@app.get("/proxy-image")
async def proxy_image(prompt: str, seed: int = 42):
    """
    Proxy Pollinations AI images to bypass Cloudflare and CORS issues.
    Uses 'requests' with a global semaphore to avoid 429 rate limits.
    """
    async with image_semaphore:
        max_retries = 3
        # Pollinations AI works better with clean, moderate-length prompts
        safe_prompt = prompt[:450].replace("\n", " ")
        encoded_prompt = urllib.parse.quote(safe_prompt)
        
        url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=1024&height=1024&nologo=true&seed={seed}"
        )
        
        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
        }
        
        last_error = ""

        for attempt in range(max_retries):
            try:
                # Add a small delay between any two sequential requests to avoid hitting rate limits
                # even when the semaphore is released.
                if attempt == 0:
                    await asyncio.sleep(1) 

                # Run the synchronous requests call in a thread pool to avoid blocking the event loop
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None, 
                    lambda: requests.get(url, headers=headers, timeout=30, verify=True)
                )
                
                if response.status_code == 200:
                    return Response(
                        content=response.content, 
                        media_type="image/jpeg", 
                        headers={
                            "Access-Control-Allow-Origin": "*",
                            "Cache-Control": "public, max-age=86400",
                            "X-Proxy-Attempt": str(attempt + 1)
                        }
                    )
                elif response.status_code == 429:
                    last_error = "Rate limit hit (429)"
                    print(f"Proxy attempt {attempt+1} failed: {last_error}")
                else:
                    last_error = f"Pollinations returned status {response.status_code}"
                    print(f"Proxy attempt {attempt+1} failed: {last_error}")
            except Exception as e:
                last_error = str(e)
                print(f"Proxy attempt {attempt+1} exception: {last_error}")
                
            if attempt < max_retries - 1:
                # Exponential backoff: 2, 4, 8 seconds + jitter
                wait_time = (2 ** (attempt + 1)) + random.random() * 2
                print(f"Retrying in {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
                
        raise HTTPException(
            status_code=500, 
            detail=f"Image Proxy Error: {last_error}. Please try again."
        )

# ─── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Story Generation API is online."}
