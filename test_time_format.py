import asyncio
import json
from src.app_services import initialize_providers
from src.models import Location

async def main():
    providers = initialize_providers()
    loc = Location(name="Prague", latitude=50.0755, longitude=14.4378)
    
    for name, p in providers:
        print(f"\n--- {name} ---")
        try:
            w = await p.get_weather(loc, days=1, language="en")
            for h in w.hourly_forecast[:3]:
                print(h.time)
        except Exception as e:
            print("Failed:", e)

asyncio.run(main())
