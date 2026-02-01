
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.aggregator import WeatherAggregator
from src.models import CurrentWeather, Astronomy

async def test_themes():
    agg = WeatherAggregator()
    
    print("Testing Theme Logic...")
    
    # helper
    async def check(name, weather, hour, expected_theme):
        theme = await agg.get_ambient_theme(weather, None, hour)
        if theme['theme'] == expected_theme:
            print(f"[PASS] {name}: {theme['theme']}")
        else:
            print(f"[FAIL] {name}: Expected {expected_theme}, got {theme['theme']}")

    # 1. Hail
    await check("Hail", CurrentWeather(temperature=20, weather_code=96), 12, "hail")
    
    # 2. Storm
    await check("Storm", CurrentWeather(temperature=20, weather_code=95), 12, "storm")
    
    # 3. Extreme Heat
    await check("Extreme Heat", CurrentWeather(temperature=35, weather_code=0), 12, "extreme_heat")
    
    # 4. Extreme Cold
    await check("Extreme Cold", CurrentWeather(temperature=-20, weather_code=0), 12, "extreme_cold")
    
    # 5. Wind
    await check("Wind", CurrentWeather(temperature=20, weather_code=0, wind_speed=50), 12, "wind")
    
    # 6. Fog Day
    await check("Fog Day", CurrentWeather(temperature=20, weather_code=45), 12, "fog")
    
    # 7. Fog Night
    await check("Fog Night", CurrentWeather(temperature=20, weather_code=45), 22, "fog_night")
    
    # 8. Rain Day
    await check("Rain Day", CurrentWeather(temperature=20, weather_code=61), 12, "rain")
    
    # 9. Rain Night
    await check("Rain Night", CurrentWeather(temperature=20, weather_code=61), 22, "rain_night")
    
    # 10. Snow Day
    await check("Snow Day", CurrentWeather(temperature=-5, weather_code=71), 12, "snow")
    
    # 11. Snow Night
    await check("Snow Night", CurrentWeather(temperature=-5, weather_code=71), 22, "snow_night")
    
    # 12. Cloudy Day
    await check("Cloudy Day", CurrentWeather(temperature=20, weather_code=3), 12, "cloudy")
    
    # 13. Cloudy Night
    await check("Cloudy Night", CurrentWeather(temperature=20, weather_code=3), 22, "cloudy_night")
    
    # 14. Clear Day (Sunny)
    await check("Sunny", CurrentWeather(temperature=20, weather_code=0), 12, "sunny")
    
    # 15. Clear Night
    await check("Clear Night", CurrentWeather(temperature=20, weather_code=0), 22, "clear_night")

    # 16. Sandstorm (by code)
    await check("Sandstorm Code", CurrentWeather(temperature=30, weather_code=30), 12, "sandstorm")
    
    # 17. Sandstorm (by description)
    await check("Sandstorm Desc", CurrentWeather(temperature=30, weather_code=0, weather_description="Heavy sandstorm"), 12, "sandstorm")
    
    # 18. Blizzard
    await check("Blizzard", CurrentWeather(temperature=-10, weather_code=71, wind_speed=60), 12, "blizzard")


if __name__ == "__main__":
    asyncio.run(test_themes())
