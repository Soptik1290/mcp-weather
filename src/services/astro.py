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
        self._tle = None
        self._tle_time = 0
        
    async def _get_iss_tle(self):
        now = datetime.now().timestamp()
        # Cache TLE for 24h
        if self._tle and (now - self._tle_time) < 86400:
            return self._tle
            
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get("https://celestrak.org/NORAD/elements/stations.txt", timeout=5.0)
                res.raise_for_status()
                lines = res.text.strip().split('\n')
                for i in range(len(lines)):
                    if "ISS (ZARYA)" in lines[i]:
                        self._tle = (lines[i].strip(), lines[i+1].strip(), lines[i+2].strip())
                        self._tle_time = now
                        return self._tle
        except Exception as e:
            print("TLE fetch error:", e)
        return None
        
    async def get_iss_position(self, lat: float = None, lon: float = None) -> Dict[str, Any]:
        """
        Get current ISS position.
        """
        result = {"latitude": 0.0, "longitude": 0.0, "timestamp": 0, "next_pass": None}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.iss_url, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("message") == "success":
                    pos = data.get("iss_position", {})
                    result["latitude"] = float(pos.get("latitude", 0))
                    result["longitude"] = float(pos.get("longitude", 0))
                    result["timestamp"] = data.get("timestamp")
        except Exception as e:
            print(f"ISS fetch error: {e}")
            
        if ephem and lat is not None and lon is not None:
            tle = await self._get_iss_tle()
            if tle:
                try:
                    observer = ephem.Observer()
                    observer.lat = str(lat)
                    observer.lon = str(lon)
                    observer.elevation = 0
                    observer.date = datetime.utcnow()
                    
                    iss = ephem.readtle(tle[0], tle[1], tle[2])
                    info = observer.next_pass(iss)
                    
                    if info and info[0]:
                        result["next_pass"] = ephem.localtime(info[0]).isoformat()
                except Exception as e:
                    print(f"ISS next pass calc error: {e}")
                    
        return result

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
        iss_data = await self.get_iss_position(lat, lon)
        
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
