"""
Aurora Borealis Forecast Provider using NOAA SWPC API.
Provides Kp index data and aurora visibility predictions.
"""

import httpx
from datetime import datetime
from typing import Optional

# NOAA SWPC API endpoints (no API key required)
NOAA_KP_REALTIME = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
NOAA_KP_FORECAST = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"


def get_kp_description(kp: float, lang: str = "en") -> str:
    """Get human-readable description of Kp index activity level."""
    descriptions = {
        "en": {
            "quiet": "Quiet",
            "unsettled": "Unsettled",
            "active": "Active",
            "minor_storm": "Minor Storm (G1)",
            "moderate_storm": "Moderate Storm (G2)",
            "strong_storm": "Strong Storm (G3)",
            "severe_storm": "Severe Storm (G4)",
            "extreme_storm": "Extreme Storm (G5)",
        },
        "cs": {
            "quiet": "Klidné",
            "unsettled": "Mírně aktivní",
            "active": "Aktivní",
            "minor_storm": "Slabá bouře (G1)",
            "moderate_storm": "Střední bouře (G2)",
            "strong_storm": "Silná bouře (G3)",
            "severe_storm": "Velmi silná bouře (G4)",
            "extreme_storm": "Extrémní bouře (G5)",
        }
    }
    
    d = descriptions.get(lang, descriptions["en"])
    
    if kp < 2:
        return d["quiet"]
    elif kp < 4:
        return d["unsettled"]
    elif kp < 5:
        return d["active"]
    elif kp < 6:
        return d["minor_storm"]
    elif kp < 7:
        return d["moderate_storm"]
    elif kp < 8:
        return d["strong_storm"]
    elif kp < 9:
        return d["severe_storm"]
    else:
        return d["extreme_storm"]


def calculate_visibility_probability(kp: float, latitude: float) -> int:
    """
    Calculate aurora visibility probability based on Kp index and latitude.
    
    Aurora visibility thresholds by latitude (approximate):
    - Kp 0-1: Only visible above ~67° (Arctic circle)
    - Kp 2-3: Visible above ~64° (Iceland, Northern Scandinavia)
    - Kp 4: Visible above ~60° (Southern Scandinavia)
    - Kp 5 (G1): Visible above ~55° (UK, Northern Germany)
    - Kp 6 (G2): Visible above ~50° (Czech Republic, Southern Germany)
    - Kp 7 (G3): Visible above ~45° (France, Northern Italy)
    - Kp 8 (G4): Visible above ~40° (Spain, Central Italy)
    - Kp 9 (G5): Visible almost everywhere in Europe
    """
    abs_lat = abs(latitude)
    
    # Minimum Kp needed to see aurora at given latitude
    kp_thresholds = [
        (67, 1),   # Arctic circle needs Kp 1+
        (64, 2),   # Iceland needs Kp 2+
        (60, 3),   # Southern Scandinavia needs Kp 3+
        (55, 5),   # UK/Northern Germany needs Kp 5+
        (50, 6),   # Czech Republic needs Kp 6+
        (45, 7),   # France needs Kp 7+
        (40, 8),   # Spain needs Kp 8+
        (35, 9),   # Very rare
    ]
    
    required_kp = 9  # Default: need extreme storm
    for lat_threshold, kp_threshold in kp_thresholds:
        if abs_lat >= lat_threshold:
            required_kp = kp_threshold
            break
    
    # Calculate probability
    if kp < required_kp - 1:
        return 0
    elif kp < required_kp:
        return int((kp - (required_kp - 1)) * 25)  # 0-25%
    elif kp == required_kp:
        return 50  # 50% at threshold
    elif kp == required_kp + 1:
        return 75  # 75% one level above
    else:
        return min(95, 50 + (kp - required_kp) * 15)  # Cap at 95%


async def get_aurora_data(latitude: float = 50.0, lang: str = "en") -> dict:
    """
    Fetch aurora data from NOAA SWPC.
    
    Args:
        latitude: User's latitude for visibility calculation
        lang: Language for descriptions ("en" or "cs")
    
    Returns:
        dict with current Kp, description, visibility probability, and forecast
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Fetch realtime Kp data
            realtime_response = await client.get(NOAA_KP_REALTIME)
            realtime_data = realtime_response.json()
            
            # Get latest Kp value (last entry is most recent)
            current_kp = 0.0
            if realtime_data:
                latest = realtime_data[-1]
                current_kp = float(latest.get("estimated_kp", 0))
            
            # Fetch forecast data
            forecast_response = await client.get(NOAA_KP_FORECAST)
            forecast_raw = forecast_response.json()
            
            # Parse forecast (skip header row)
            forecast = []
            now = datetime.utcnow()
            for row in forecast_raw[1:]:  # Skip header
                time_str, kp_str, status, noaa_scale = row
                try:
                    time = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
                    kp = float(kp_str)
                    
                    # Only include future predictions
                    if time > now and status in ("estimated", "predicted"):
                        forecast.append({
                            "time": time_str,
                            "kp": kp,
                            "scale": noaa_scale,  # G1, G2, etc. or null
                        })
                except (ValueError, TypeError):
                    continue
            
            # Calculate max forecast Kp for visibility prediction
            max_forecast_kp = max([f["kp"] for f in forecast[:8]] + [current_kp]) if forecast else current_kp
            
            # Find best viewing time (highest Kp in next 24h that's also at night)
            best_time = None
            best_kp = current_kp
            for f in forecast[:8]:  # Next 24 hours (8 x 3h periods)
                try:
                    time = datetime.strptime(f["time"], "%Y-%m-%d %H:%M:%S")
                    hour = time.hour
                    # Aurora is best visible at night (20:00 - 04:00)
                    is_night = hour >= 20 or hour <= 4
                    if f["kp"] > best_kp and is_night:
                        best_kp = f["kp"]
                        best_time = f["time"]
                except:
                    continue
            
            # If no nighttime peak found, just use highest Kp time
            if best_time is None and forecast:
                best_entry = max(forecast[:8], key=lambda x: x["kp"], default=None)
                if best_entry:
                    best_time = best_entry["time"]
                    best_kp = best_entry["kp"]
            
            return {
                "current_kp": round(current_kp, 1),
                "current_description": get_kp_description(current_kp, lang),
                "visibility_probability": calculate_visibility_probability(current_kp, latitude),
                "max_forecast_kp": round(max_forecast_kp, 1),
                "max_visibility_probability": calculate_visibility_probability(max_forecast_kp, latitude),
                "best_viewing_time": best_time,
                "best_viewing_kp": round(best_kp, 1),
                "forecast": forecast[:24],  # Next 24 3-hour periods (3 days)
                "timestamp": datetime.utcnow().isoformat(),
                "source": "NOAA Space Weather Prediction Center",
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "current_kp": None,
                "visibility_probability": None,
            }
