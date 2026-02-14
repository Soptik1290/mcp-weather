import type { WeatherData, Location, AmbientTheme, AstroPackData } from '../types';

// API Base URL - adjust for production
const API_BASE_URL = __DEV__
    ? 'http://10.0.2.2:8000'  // Android emulator localhost
    : 'https://api.weatherly.ai';

// For iOS simulator, use: 'http://localhost:8000'
// For physical device, use your computer's IP

interface SearchResult {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

interface WeatherResponse {
    location: Location;
    current: WeatherData['current'];
    daily_forecast: WeatherData['daily_forecast'];
    hourly_forecast: WeatherData['hourly_forecast'];
    astronomy?: WeatherData['astronomy'];
    ai_summary?: string;
    confidence_score: number;
    sources_used: string[];
}

interface ThemeResponse {
    name: string;
    gradient: string[];
    is_dark: boolean;
}

class WeatherService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async searchLocation(query: string, language: string = 'cs'): Promise<SearchResult[]> {
        try {
            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, language }),
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Search location error:', error);
            throw error;
        }
    }

    async getCurrentWeather(
        locationName: string,
        language: string = 'cs',
        tier: string = 'free',
        confidenceBias: string = 'balanced'
    ): Promise<WeatherResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/weather/current`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: locationName, language, tier, confidence_bias: confidenceBias }),
            });

            if (!response.ok) {
                throw new Error(`Weather fetch failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get current weather error:', error);
            throw error;
        }
    }

    async getWeatherForecast(
        locationName: string,
        days: number = 7,
        language: string = 'cs',
        tier: string = 'free',
        confidenceBias: string = 'balanced'
    ): Promise<WeatherResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/weather/forecast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: locationName, days, language, tier, confidence_bias: confidenceBias }),
            });

            if (!response.ok) {
                throw new Error(`Forecast fetch failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get weather forecast error:', error);
            throw error;
        }
    }

    async getWeatherByCoordinates(
        latitude: number,
        longitude: number,
        days: number = 7,
        language: string = 'cs',
        tier: string = 'free',
        confidenceBias: string = 'balanced'
    ): Promise<WeatherResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/weather/coordinates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, days, language, tier, confidence_bias: confidenceBias }),
            });

            if (!response.ok) {
                throw new Error(`Coordinates weather fetch failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get weather by coordinates error:', error);
            throw error;
        }
    }

    async getAmbientTheme(locationName: string): Promise<ThemeResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: locationName }),
            });

            if (!response.ok) {
                throw new Error(`Theme fetch failed: ${response.status}`);
            }

            return await response.json();
            return await response.json();
        } catch (error) {
            console.error('Get ambient theme error:', error);
            throw error;
        }
    }

    async getSmartSummary(params: {
        location: string;
        lat: number;
        lon: number;
        language: string;
        tier: string;
        include_astronomy: boolean;
    }): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/weather/smart_summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_name: params.location,
                    latitude: params.lat,
                    longitude: params.lon,
                    language: params.language,
                    tier: params.tier,
                    include_astronomy: params.include_astronomy
                }),
            });

            if (!response.ok) {
                // If endpoint doesn't exist, generic fallback
                return "Daily weather summary not available.";
            }

            // Backend returns { summary: "..." } or raw string?
            // Usually Python backend returns JSON. 
            const data = await response.json();
            return data.summary || data; // Handle both wrapper and raw
        } catch (error) {
            console.error('Get smart summary error:', error);
            return "Unable to fetch daily summary.";
        }
    }

    async getAuroraForecast(
        latitude: number = 50,
        language: string = 'cs'
    ): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/aurora`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, language }),
            });

            if (!response.ok) {
                throw new Error(`Aurora fetch failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get aurora forecast error:', error);
            throw error;
        }
    }

    async getAstroPack(
        latitude: number,
        longitude: number,
        language: string = 'cs'
    ): Promise<AstroPackData> {
        try {
            const response = await fetch(`${this.baseUrl}/astro/pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, language }),
            });

            if (!response.ok) {
                throw new Error(`AstroPack fetch failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get AstroPack error:', error);
            throw error;
        }
    }

    async explainWeather(
        location: string,
        language: string,
        tier: string,
        confidenceBias: string
    ): Promise<{ explanation: string; sources_data: any[] }> {
        try {
            const response = await fetch(`${this.baseUrl}/weather/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: location, language, tier, confidence_bias: confidenceBias }),
            });

            if (!response.ok) {
                throw new Error(`Explain request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Explain weather error:', error);
            throw error;
        }
    }
}

export const weatherService = new WeatherService();
export default weatherService;
