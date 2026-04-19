import requests
import urllib.parse
import time

def verify_proxy_logic():
    prompt = "A high-tech futuristic city with neon lights and flying cars, digital storybook illustration"
    safe_prompt = prompt[:450].replace("\n", " ")
    encoded_prompt = urllib.parse.quote(safe_prompt)
    seed = 123
    
    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width=1024&height=1024&nologo=true&seed={seed}"
    )
    
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://pollinations.ai/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    print(f"Testing URL: {url}")
    print("Headers:", headers)
    
    try:
        start_time = time.time()
        response = requests.get(url, headers=headers, timeout=30)
        end_time = time.time()
        
        print(f"Time taken: {end_time - start_time:.2f}s")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Success! Image size: {len(response.content)} bytes")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
        else:
            print(f"Failed with status code {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"Error during verify_proxy_logic: {e}")

if __name__ == "__main__":
    verify_proxy_logic()
