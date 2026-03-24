import httpx
import json

def fetch_open_meteo():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 50.0755,
        "longitude": 14.4378,
        "hourly": ["temperature_2m"],
        "timezone": "auto",
        "forecast_days": 1
    }
    
    response = httpx.get(url, params=params)
    data = response.json()
    
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    
    for t, temp in zip(times[:8], temps[:8]):
        print(f"{t}: {temp} C")

if __name__ == "__main__":
    fetch_open_meteo()
