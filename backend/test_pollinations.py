import requests
import urllib.parse

def test_pollinations():
    prompt = "A beautiful magical forest with glowing mushrooms"
    encoded_prompt = urllib.parse.quote(prompt)
    seed = 42
    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width=1024&height=683&nologo=true&seed={seed}"
    )
    
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/91.0.4472.124 Safari/537.36'
        )
    }
    
    print(f"Testing URL: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type')}")
        if response.status_code == 200:
            print(f"Success! Image size: {len(response.content)} bytes")
        else:
            print(f"Failed with status code {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_pollinations()
