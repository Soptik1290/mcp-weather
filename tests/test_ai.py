import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Simulate the fetchAISummary call
        resp = await client.post("http://localhost:8000/weather/ai-summary", json={
            "location_name": "Prague",
            "language": "cs",
            "confidence_bias": "balanced"
        })
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

asyncio.run(test())
