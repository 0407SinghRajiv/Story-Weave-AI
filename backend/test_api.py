import requests
import json

data = {
    "theme": "A futuristic city in the clouds",
    "keywords": "flying cars, neon lights, cyber-detective",
    "language": "English",
    "length": "short"
}

response = requests.post("http://localhost:8000/generate-story", json=data)

print(response.status_code)
print(response.json())
