import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def test_google_genai():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in .env")
        return False
        
    try:
        client = genai.Client(api_key=api_key)
        # Test image generation with Imagen 3
        result = client.models.generate_images(
            model='imagen-3.0-generate-001',
            prompt='A comic book style panel of a futuristic city',
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="1:1"
            )
        )
        for generated_image in result.generated_images:
            print("Generated image successfully (bytes length):", len(generated_image.image.image_bytes))
            return True
            
    except Exception as e:
        print("Error with google-genai:", e)
        return False

if __name__ == "__main__":
    if not test_google_genai():
        print("Failed with google-genai. We will check google-generativeai.")
