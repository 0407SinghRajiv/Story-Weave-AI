import requests
import urllib.parse
import time

def verify_proxy_logic_v2():
    prompt = "A high-tech futuristic city with neon lights and flying cars, digital storybook illustration"
    safe_prompt = prompt[:450].replace("\n", " ")
    encoded_prompt = urllib.parse.quote(safe_prompt)
    seed = 123
    
    # URL 1: dedicated image domain
    url1 = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width=1024&height=1024&nologo=true&seed={seed}"
    )
    
    # URL 2: main domain
    url2 = (
        f"https://pollinations.ai/p/{encoded_prompt}"
        f"?width=1024&height=1024&nologo=true&seed={seed}"
    )
    
    # Simple headers that usually work
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    for i, url in enumerate([url1, url2]):
        print(f"\n--- Testing URL {i+1}: {url} ---")
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
            print(f"Error: {e}")

if __name__ == "__main__":
    verify_proxy_logic_v2()
