import asyncio
from src.aggregator import WeatherAggregator
from src.models import Location, WeatherData, CurrentWeather

async def test_agg():
    agg = WeatherAggregator()
    from dotenv import load_dotenv
    load_dotenv()
    
    loc = Location(name="Prague", latitude=50, longitude=14)
    cw = CurrentWeather(temperature=15)
    w = WeatherData(provider="mock", location=loc, current=cw, daily_forecast=[], hourly_forecast=[])
    
    try:
        # test generate_ai_summary
        res = await agg.generate_ai_summary([w], "en", "balanced")
        print("generate_ai_summary SUCCESS:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("generate_ai_summary ERROR:", e)

    try:
        # test aggregate
        res2 = await agg.aggregate([w], "en", "gpt-5-mini")
        print("aggregate SUCCESS:", res2.ai_summary)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("aggregate ERROR:", e)

asyncio.run(test_agg())
