import os
import json
from services.llm_service import generate_story_from_llm, generate_story_pages
from dotenv import load_dotenv

load_dotenv()

def test_hindi_generation():
    print("Testing Hindi Story Generation...")
    theme = "Fantasy"
    keywords = "magic, dragon, mountain"
    language = "Hindi"
    length = "Micro (~100 words)"
    tone = "Whimsical"

    try:
        story_result = generate_story_from_llm(theme, keywords, language, length, tone)
        if "error" in story_result:
            print(f"Error in story generation: {story_result['error']}")
            return

        print("\n--- Generated Story (Hindi) ---")
        print(f"Title: {story_result.get('title')}")
        print(f"Story: {story_result.get('story')[:200]}...")
        
        # Verify if it's actually Hindi (simple check for non-ASCII)
        story_text = story_result.get('story', '')
        is_hindi = any(ord(c) > 127 for c in story_text)
        print(f"Is regional script detected: {is_hindi}")

        if not is_hindi:
            print("WARNING: Story seems to be in English despite Hindi request.")
        else:
            print("SUCCESS: Story generated in regional script.")

        print("\nTesting Story Pages Generation (Hindi)...")
        pages_result = generate_story_pages(story_result['story'], theme)
        if "error" in pages_result:
            print(f"Error in pages generation: {pages_result['error']}")
            return

        print(f"Generated {len(pages_result.get('pages', []))} pages.")
        for i, page in enumerate(pages_result.get('pages', [])[:2]):
            print(f"\nPage {i+1}:")
            print(f"Narration: {page.get('narration')[:100]}...")
            print(f"Image Prompt (English): {page.get('image_prompt')}")
            
            page_is_hindi = any(ord(c) > 127 for c in page.get('narration', ''))
            print(f"Page narration is in regional script: {page_is_hindi}")

    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    test_hindi_generation()
