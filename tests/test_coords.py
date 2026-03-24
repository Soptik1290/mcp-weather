import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Assuming backend is running locally on 8000
        # If not, we will get connection refused
        try:
            resp = await client.post("http://127.0.0.1:8000/weather/coordinates", json={
                "latitude": 50.0755,
                "longitude": 14.4378,
                "days": 1,
                "language": "cs",
                "tier": "free",
                "confidence_bias": "balanced"
            })
            data = resp.json()
            hourly = data.get("hourly_forecast", [])
            for i, h in enumerate(hourly[:12]):
                print(f"Index {i}: time={h.get('time')}, temp={h.get('temperature')}")
        except Exception as e:
            print("Error connecting to backend:", e)

asyncio.run(main())
