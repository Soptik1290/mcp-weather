

// API Base URL - adjust for production
const API_BASE_URL = __DEV__
    ? 'http://10.0.2.2:8000'  // Android emulator localhost
    : 'https://api.weatherly.ai';

export interface ISSPosition {
    latitude: number;
    longitude: number;
    timestamp: number;
}

export interface MeteorShower {
    name: string;
    status: 'active' | 'peak' | 'near_peak';
    peak_date: string;
    intensity: number;
}

export interface AstroPackData {
    iss: ISSPosition | null;
    meteors: MeteorShower[];
}

export const astroService = {
    getAstroPack: async (lat: number, lon: number): Promise<AstroPackData> => {
        try {
            const response = await fetch(`${API_BASE_URL}/astro/pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon }),
            });

            if (!response.ok) {
                throw new Error(`AstroPack fetch failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('AstroPack fetch error:', error);
            throw error;
        }
    },

    explainWeather: async (location: string, language: string, tier: string, confidenceBias: string): Promise<{ explanation: string; sources_data: any[] }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/weather/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: location, language, tier, confidence_bias: confidenceBias }),
            });

            if (!response.ok) {
                throw new Error(`Explain fetch failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Explain weather error:', error);
            throw error;
        }
    }
};
