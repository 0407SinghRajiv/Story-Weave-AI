import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq()
response = client.chat.completions.create(
    messages=[{"role": "user", "content": "hi"}],
    model="llama-3.1-8b-instant"
)
print(response.choices[0].message.content)
