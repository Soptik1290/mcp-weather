
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.providers.open_meteo import OpenMeteoProvider
from src.aggregator import WeatherAggregator
from src.models import Location

async def test_astronomy():
    print("Testing Astronomy Backfill via Aggregator...")
    provider = OpenMeteoProvider()
    aggregator = WeatherAggregator()
    
    # Test location: Prague
    location = Location(name="Prague", latitude=50.0755, longitude=14.4378)
    
    try:
        # Get raw data (missing some astro fields)
        raw_data = await provider.get_weather(location)
        print("Raw OpenMeteo Data obtained.")
        
        # Aggregate (triggers backfill)
        result = await aggregator.aggregate([raw_data])
        astro = result.astronomy
        
        if not astro:
            print("[FAIL] No astronomy data returned")
            return

        print(f"Sunrise: {astro.sunrise}")
        print(f"Sunset: {astro.sunset}")
        print(f"Moonrise: {astro.moonrise}")
        print(f"Moonset: {astro.moonset}")
        print(f"Moon Phase: {astro.moon_phase} ({astro.moon_phase_name})")
        print(f"Illumination: {astro.moon_illumination}%")
        print(f"Distance: {astro.moon_distance} km")
        print(f"Next Full: {astro.next_full_moon}")
        print(f"Daylight Duration: {astro.daylight_duration}s")
        
        missing = []
        if not astro.moonrise: missing.append("moonrise")
        if not astro.moonset: missing.append("moonset")
        if astro.moon_illumination is None: missing.append("moon_illumination")
        if not astro.moon_distance: missing.append("moon_distance")
        if not astro.next_full_moon: missing.append("next_full_moon")
        if not astro.daylight_duration: missing.append("daylight_duration")
        
        if missing:
            print(f"[FAIL] Missing fields: {', '.join(missing)}")
        else:
            print("[PASS] All astronomy fields present (Backfill successful)")
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
    finally:
        await provider.close()

if __name__ == "__main__":
    asyncio.run(test_astronomy())
