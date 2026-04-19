import asyncio
import aiohttp
import time
import traceback

async def fetch_image(session, i):
    prompt = f"A cute cartoon cat wearing a hat, panel {i}"
    url = f"http://127.0.0.1:8000/proxy-image?prompt={prompt}&seed={i*100}"
    
    start_time = time.time()
    print(f"Request {i} started...")
    try:
        # Increased timeout to 120s because of sequential queueing
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=120)) as response:
            status = response.status
            content = await response.read()
            end_time = time.time()
            if status == 200:
                print(f"Request {i} finished with status {status} in {end_time - start_time:.2f}s (Size: {len(content)} bytes)")
            else:
                print(f"Request {i} failed with status {status} in {end_time - start_time:.2f}s")
            return status, len(content)
    except Exception as e:
        print(f"Request {i} exception: {type(e).__name__}: {e}")
        traceback.print_exc()
        return 500, 0

async def main():
    # Use a TCPConnector to prevent connection pooling issues if any
    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Simulate 4 concurrent requests (like 4 comic panels)
        tasks = [fetch_image(session, i) for i in range(4)]
        print("Starting 4 concurrent requests to verify semaphore and backoff...")
        results = await asyncio.gather(*tasks)
        print("\nAll requests completed.")
        for i, (status, size) in enumerate(results):
            print(f"Panel {i}: Status {status}, Size {size}")

if __name__ == "__main__":
    asyncio.run(main())
