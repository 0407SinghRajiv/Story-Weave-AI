import os
import json
from groq import Groq
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Securely load API key
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable not found in .env")

client = Groq(api_key=api_key)

def generate_story_from_llm(theme: str, keywords: str, language: str, length: str, tone: str) -> dict:
    """
    Generates a story using Gemini 2.0 Flash for high-quality regional language support.
    """
    if not gemini_client:
        return {"error": "GEMINI_API_KEY environment variable not found in .env"}

    # Determine if we should emphasize translation/native writing
    is_hindi = language.lower() == "hindi"
    
    prompt = f"""
    You are a professional storyteller. Your task is to generate a structured story with a clear beginning, middle, and end.
    
    Strictly follow these requirements:
    - Theme: {theme}
    - Keywords: {keywords}
    - Language: {language}
    - Length: The story MUST be an exact approximation of the selected length: {length}.
    - Tone: {tone}
    - Narration: Engaging, highly creative, and maintaining a logical flow.

    IMPORTANT: The entire JSON output including "title" and "story" MUST BE WRITTEN IN {language}. 
    If the language is Hindi, the text must be in Devnagari script.
    If the language is Bengali, use Bengali script, etc.

    Please provide the output only as a valid JSON object with the keys "title" and "story". Do not include any extra text, only the JSON.
    Example format:
    {{
        "title": "A Creative Title in {language}",
        "story": "The engaging narrative in {language} starts here..."
    }}
    """

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7
            )
        )
        
        story_json = json.loads(response.text)
        return story_json
        
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            try:
                groq_response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile",
                    response_format={"type": "json_object"}
                )
                return json.loads(groq_response.choices[0].message.content)
            except Exception as ge:
                return {"error": f"Gemini exhausted and Groq failed: {str(ge)}"}
        return {"error": error_msg}

class ComicPanel(BaseModel):
    caption: str
    image_prompt: str

class ComicResponse(BaseModel):
    panels: list[ComicPanel]

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    gemini_client = genai.Client(api_key=gemini_api_key)
else:
    gemini_client = None

def generate_comic_prompts(story: str, theme: str) -> dict:
    if not gemini_client:
        return {"error": "GEMINI_API_KEY environment variable not found in .env"}
        
    prompt = f"""
    You are an expert children's book illustrator and storyboard artist.
    Analyze the following short story (Theme: {theme}) and create exactly 4 storybook illustrations to visually represent it.
    For each illustration, provide:
    1. A short narrative caption to display below the image.
    2. A highly detailed, descriptive image prompt that will be sent to an AI image generator. The prompt should specify lighting, art style (e.g., highly detailed storybook illustration, watercolor, {theme} style), subjects, and actions, without any text.

    Story:
    {story}
    """
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComicResponse,
                temperature=0.7
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}

class StoryPagePrompt(BaseModel):
    narration: str
    image_prompt: str

class StoryStructureResponse(BaseModel):
    pages: list[StoryPagePrompt]

def generate_story_pages(story: str, theme: str) -> dict:
    if not gemini_client:
        return {"error": "GEMINI_API_KEY environment variable not found in .env"}
        
    prompt = f"""
    You are an expert children's book illustrator and storyboard artist.
    Analyze the following short story (Theme: {theme}) and split it into pages. 
    Each page should contain a reasonable chunk of the narrative, about 3 to 5 sentences. 
    The entire story MUST be covered from beginning to end with no omissions.
    
    For each page, provide:
    1. A 'narration' containing the exact narrative text from the story that belongs on this page. IT MUST BE IN THE ORIGINAL LANGUAGE OF THE STORY (e.g. Hindi, Bengali).
    2. A highly detailed, descriptive 'image_prompt' in ENGLISH that will be sent to an AI image generator. The prompt should specify lighting, art style (e.g., highly detailed children's storybook illustration, watercolor, {theme} style), subjects, and actions, without containing any text.

    Story:
    {story}
    """
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StoryStructureResponse,
                temperature=0.7
            )
        )
        return json.loads(response.text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            try:
                # Groq fallback for story pages - enforce schema in prompt
                groq_prompt = (
                    prompt + 
                    "\n\nIMPORTANT: You must return a valid JSON object ONLY. "
                    "Format: {\"pages\": [{\"narration\": \"...\", \"image_prompt\": \"...\"}, ...]}"
                )
                groq_response = client.chat.completions.create(
                    messages=[{"role": "user", "content": groq_prompt}],
                    model="llama-3.3-70b-versatile",
                    response_format={"type": "json_object"}
                )
                return json.loads(groq_response.choices[0].message.content)
            except Exception as ge:
                return {"error": f"Gemini exhausted and Groq failed for pages: {str(ge)}"}
        return {"error": error_msg}

