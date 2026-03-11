
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
    passed = 0
    failed = 0
    
    # helper
    async def check(name, weather, hour, expected_theme):
        nonlocal passed, failed
        theme = await agg.get_ambient_theme(weather, None, hour)
        if theme['theme'] == expected_theme:
            print(f"[PASS] {name}: {theme['theme']}")
            passed += 1
        else:
            print(f"[FAIL] {name}: Expected {expected_theme}, got {theme['theme']}")
            failed += 1

    # === Day themes ===
    # 1. Hail Day
    await check("Hail Day", CurrentWeather(temperature=20, weather_code=96), 12, "hail")
    
    # 2. Storm (always dark, same day/night)
    await check("Storm", CurrentWeather(temperature=20, weather_code=95), 12, "storm")
    
    # 3. Extreme Heat Day
    await check("Extreme Heat Day", CurrentWeather(temperature=35, weather_code=0), 12, "extreme_heat")
    
    # 4. Extreme Cold Day
    await check("Extreme Cold Day", CurrentWeather(temperature=-20, weather_code=0), 12, "extreme_cold")
    
    # 5. Wind Day
    await check("Wind Day", CurrentWeather(temperature=20, weather_code=0, wind_speed=50), 12, "wind")
    
    # 6. Fog Day
    await check("Fog Day", CurrentWeather(temperature=20, weather_code=45), 12, "fog")
    
    # 7. Rain Day
    await check("Rain Day", CurrentWeather(temperature=20, weather_code=61), 12, "rain")
    
    # 8. Snow Day
    await check("Snow Day", CurrentWeather(temperature=-5, weather_code=71), 12, "snow")
    
    # 9. Cloudy Day
    await check("Cloudy Day", CurrentWeather(temperature=20, weather_code=3), 12, "cloudy")
    
    # 10. Sunny (Clear Day)
    await check("Sunny", CurrentWeather(temperature=20, weather_code=0), 12, "sunny")
    
    # 11. Sandstorm Day (by code)
    await check("Sandstorm Code Day", CurrentWeather(temperature=30, weather_code=30), 12, "sandstorm")
    
    # 12. Sandstorm Day (by description)
    await check("Sandstorm Desc Day", CurrentWeather(temperature=30, weather_code=0, weather_description="Heavy sandstorm"), 12, "sandstorm")
    
    # 13. Blizzard Day
    await check("Blizzard Day", CurrentWeather(temperature=-10, weather_code=71, wind_speed=60), 12, "blizzard")

    # === Night themes ===
    # 14. Hail Night
    await check("Hail Night", CurrentWeather(temperature=20, weather_code=96), 22, "hail_night")
    
    # 15. Storm Night (still 'storm' - already dark)
    await check("Storm Night", CurrentWeather(temperature=20, weather_code=95), 22, "storm")
    
    # 16. Extreme Heat Night
    await check("Extreme Heat Night", CurrentWeather(temperature=35, weather_code=0), 22, "extreme_heat_night")
    
    # 17. Extreme Cold Night
    await check("Extreme Cold Night", CurrentWeather(temperature=-20, weather_code=0), 22, "extreme_cold_night")
    
    # 18. Wind Night
    await check("Wind Night", CurrentWeather(temperature=20, weather_code=0, wind_speed=50), 22, "wind_night")
    
    # 19. Fog Night
    await check("Fog Night", CurrentWeather(temperature=20, weather_code=45), 22, "fog_night")
    
    # 20. Rain Night
    await check("Rain Night", CurrentWeather(temperature=20, weather_code=61), 22, "rain_night")
    
    # 21. Snow Night
    await check("Snow Night", CurrentWeather(temperature=-5, weather_code=71), 22, "snow_night")
    
    # 22. Cloudy Night
    await check("Cloudy Night", CurrentWeather(temperature=20, weather_code=3), 22, "cloudy_night")
    
    # 23. Clear Night
    await check("Clear Night", CurrentWeather(temperature=20, weather_code=0), 22, "clear_night")

    # 24. Sandstorm Night (by code)
    await check("Sandstorm Night", CurrentWeather(temperature=30, weather_code=30), 22, "sandstorm_night")
    
    # 25. Blizzard Night
    await check("Blizzard Night", CurrentWeather(temperature=-10, weather_code=71, wind_speed=60), 22, "blizzard_night")

    # === Boundary tests ===
    # 26. Hour 20 should be NIGHT (boundary fix)
    await check("Hour 20 = Night (Fog)", CurrentWeather(temperature=20, weather_code=45), 20, "fog_night")
    
    # 27. Hour 19 should still be sunset for clear weather
    await check("Hour 19 = Sunset", CurrentWeather(temperature=20, weather_code=0), 19, "sunset")
    
    # 28. Hour 5 should be night
    await check("Hour 5 = Sunrise", CurrentWeather(temperature=20, weather_code=0), 5, "sunrise")
    
    # 29. Hour 6 should be sunrise
    await check("Hour 6 = Sunrise", CurrentWeather(temperature=20, weather_code=0), 6, "sunrise")

    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed out of {passed+failed}")
    if failed == 0:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")


if __name__ == "__main__":
    asyncio.run(test_themes())
