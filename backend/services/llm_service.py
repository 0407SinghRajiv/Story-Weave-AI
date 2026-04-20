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

def generate_story_from_llm(theme: str, keywords: str, language: str, length: str, tone: str, audience: str = "Kid (6-10 years)") -> dict:
    """
    Generates a story using Gemini 2.0 Flash for high-quality regional language support.
    """
    if not gemini_client:
        return {"error": "GEMINI_API_KEY environment variable not found in .env"}

    # Determine if we should emphasize translation/native writing
    is_hindi = language.lower() == "hindi"
    
    prompt = f"""
    You are a professional children's book author and master storyteller. 
    Your task is to generate a highly engaging, structured story tailored for a specific audience.

    STORY SPECIFICATIONS:
    - Target Audience: {audience}
    - Language: {language}
    - Theme: {theme}
    - Keywords to integrate: {keywords}
    - Length: Approximately {length}
    - Tone: {tone} (Adapt this tone appropriately for the {audience} age group)

    STRICT NARRATIVE STRUCTURE:
    The story MUST follow a classic narrative arc:
    1. Introduction: Set the scene and introduce the main character(s).
    2. Inciting Incident: A clear event that starts the adventure or problem.
    3. Rising Action: A series of events (logical flow) that build tension or interest.
    4. Climax: The peak of the story, most exciting part, or the moment the main problem is faced.
    5. Falling Action: The immediate aftermath of the climax.
    6. Resolution/Moral: A satisfying conclusion, often with a subtle lesson or a happy ending.

    VOCABULARY & STYLE RULES:
    - If Audience is "Toddler (3-5 years)": Use extremely simple, repetitive words, very short sentences, and basic concepts. Avoid any scary or complex themes.
    - If Audience is "Kid (6-10 years)": Use clear, easy-to-understand language. Sentences should be varied but simple. Avoid advanced jargon or archaic words.
    - If Audience is "Teen (11-15 years)": Use more descriptive vocabulary and more complex emotional themes.
    - If Audience is "Adult": Use sophisticated language, complex metaphors, and mature themes.

    IMPORTANT: The entire JSON output including "title" and "story" MUST BE WRITTEN IN {language}. 
    - If {language} is Hindi, use Devnagari script.
    - If {language} is Bengali, use Bengali script, etc.

    Return ONLY a valid JSON object with keys "title" and "story". No other text.
    Example:
    {{
        "title": "A Great Title",
        "story": "The full narrative goes here..."
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

