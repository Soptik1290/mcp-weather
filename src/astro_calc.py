
import ephem
import math
from datetime import datetime, date, timedelta

def get_astronomy_data(lat: float, lon: float, dt: date = None):
    """
    Calculate astronomy data for a given location and date using ephem.
    Returns a dict with moonrise, moonset, moon_illumination, moon_phase, daylight_duration.
    All times are ISO formatted strings or None.
    """
    if dt is None:
        dt = date.today()
        
    observer = ephem.Observer()
    observer.lat = str(lat)
    observer.lon = str(lon)
    # Set date to midnight UTC
    observer.date = dt
    
    sun = ephem.Sun()
    moon = ephem.Moon()
    
    # Helper to clean date
    def format_date(d):
        if not d: return None
        try:
            return ephem.localtime(d).isoformat()
        except:
            return d.datetime().isoformat()

    # Sun times
    sunrise = None
    sunset = None
    daylight_duration = None
    
    try:
        # Calculate sunrise/sunset relative to the observer date (midnight)
        # We want the sunrise/sunset strictly for the given date.
        # usually next_rising(sun) from midnight gives today's sunrise.
        sunrise_d = observer.next_rising(sun)
        sunset_d = observer.next_setting(sun)
        
        # Simple daylight duration
        # If sunset is before sunrise (e.g. calculated for next day vs today), careful.
        # But starting from midnight:
        # Sunrise should be e.g. 0.2 (4.8h)
        # Sunset should be e.g. 0.7 (16.8h)
        if sunset_d > sunrise_d:
             daylight_duration = (sunset_d - sunrise_d) * 24 * 3600
        else:
             # Sunset found is likely previous day or sunrise is next day?
             # Actually observer.next_setting returns next setting AFTER start date.
             pass

        sunrise = format_date(sunrise_d)
        sunset = format_date(sunset_d)
    except Exception as e:
        print(f"Sun calc error: {e}")

    # Moon times
    moonrise = None
    moonset = None
    try:
        moonrise = format_date(observer.next_rising(moon))
        moonset = format_date(observer.next_setting(moon))
    except:
        pass
        
    # Phase
    illumination = 0
    moon_phase_01 = 0
    
    try:
        observer.date = dt # Reset date for computation (noon might be better for phase?)
        sun.compute(observer)
        moon.compute(observer)
        illumination = int(moon.phase)
        
        # Calculate phase 0-1 using Right Ascension
        # Waxing: Moon is East of Sun
        ra_diff = float(moon.ra) - float(sun.ra)
        # Normalize to 0-2pi
        while ra_diff < 0: ra_diff += 2 * math.pi
        while ra_diff >= 2 * math.pi: ra_diff -= 2 * math.pi
        
        moon_phase_01 = ra_diff / (2 * math.pi)
        
        # Moon Distance (AU to km)
        # 1 AU = 149,597,870.7 km
        moon_dist_km = moon.earth_distance * 149597870.7
        
        # Next Full Moon
        # relative to now
        next_full = ephem.next_full_moon(dt)
        next_full_iso = format_date(next_full)
        
    except Exception as e:
        print(f"Phase calc error: {e}")
        moon_dist_km = None
        next_full_iso = None

    return {
        "moonrise": moonrise,
        "moonset": moonset,
        "moon_illumination": illumination,
        "moon_phase": moon_phase_01,
        "daylight_duration": daylight_duration,
        "moon_distance": int(moon_dist_km) if moon_dist_km else None,
        "next_full_moon": next_full_iso
    }
