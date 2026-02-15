import httpx
from datetime import date, datetime
from typing import Dict, Any, Optional, List

try:
    import ephem
except ImportError:
    ephem = None
    print("WARNING: 'ephem' library not found. Astro calculations will fail.")

class AstroService:
    """
    Service for astronomy data: ISS tracking and Meteor Showers.
    """
    
    def __init__(self):
        self.iss_url = "http://api.open-notify.org/iss-now.json"
        
    async def get_iss_position(self) -> Dict[str, Any]:
        """
        Get current ISS position.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.iss_url, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                data = response.json()
                
                if data.get("message") == "success":
                    pos = data.get("iss_position", {})
                    return {
                        "latitude": float(pos.get("latitude", 0)),
                        "longitude": float(pos.get("longitude", 0)),
                        "timestamp": data.get("timestamp")
                    }
                return {"latitude": 0.0, "longitude": 0.0, "timestamp": 0}
        except Exception as e:
            print(f"ISS fetch error: {e}")
            return {"latitude": 0.0, "longitude": 0.0, "timestamp": 0}

    def get_meteor_showers(self, today: date = None) -> List[Dict[str, Any]]:
        """
        Get active meteor showers for the given date.
        """
        if today is None:
            today = date.today()
            
        year = today.year
        
        # Major meteor showers (approximate dates)
        showers = [
            {"name": "Quadrantids", "start": date(year, 1, 1), "end": date(year, 1, 5), "peak": date(year, 1, 3), "zhr": 110},
            {"name": "Lyrids", "start": date(year, 4, 16), "end": date(year, 4, 25), "peak": date(year, 4, 22), "zhr": 18},
            {"name": "Eta Aquariids", "start": date(year, 4, 19), "end": date(year, 5, 28), "peak": date(year, 5, 5), "zhr": 50},
            {"name": "Perseids", "start": date(year, 7, 17), "end": date(year, 8, 24), "peak": date(year, 8, 12), "zhr": 100},
            {"name": "Orionids", "start": date(year, 10, 2), "end": date(year, 11, 7), "peak": date(year, 10, 21), "zhr": 20},
            {"name": "Leonids", "start": date(year, 11, 6), "end": date(year, 11, 30), "peak": date(year, 11, 17), "zhr": 10},
            {"name": "Geminids", "start": date(year, 12, 4), "end": date(year, 12, 17), "peak": date(year, 12, 14), "zhr": 150},
            {"name": "Ursids", "start": date(year, 12, 17), "end": date(year, 12, 26), "peak": date(year, 12, 22), "zhr": 10},
        ]
        
        active = []
        for s in showers:
            if s["start"] <= today <= s["end"]:
                # Calculate simple status
                status = "active"
                if today == s["peak"]:
                    status = "peak"
                elif abs((today - s["peak"]).days) <= 1:
                    status = "near_peak"
                    
                active.append({
                    "name": s["name"],
                    "status": status,
                    "peak_date": s["peak"].isoformat(),
                    "intensity": s["zhr"]
                })
                
        return active

    async def get_astro_pack(self, lat: float, lon: float, dt: date = None) -> Dict[str, Any]:
        """
        Get comprehensive AstroPack data (ISS + Meteors).
        """
        iss_data = await self.get_iss_position()
        
        if not ephem:
             return {
                 "iss": iss_data,
                 "meteors": []
             }

        meteors = self.get_meteor_showers(dt)
        
        return {
            "iss": iss_data,
            "meteors": meteors
        }

# Singleton instance
astro_service = AstroService()
