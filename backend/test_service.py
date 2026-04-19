from services.llm_service import generate_story_from_llm

response = generate_story_from_llm(
    theme="A futuristic city in the clouds",
    keywords="flying cars, neon lights, cyber-detective",
    language="English",
    length="short"
)
print(response)
