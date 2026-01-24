/**
 * MCP Weather API Client
 * Connects the frontend to the Python FastAPI server
 */

import { WeatherResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Search for locations by name
 */
export async function searchLocations(query: string): Promise<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
}[]> {
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Failed to search locations:', error);
        return [];
    }
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(
    locationName: string,
    language: string = 'en'
): Promise<WeatherResponse | null> {
    try {
        const response = await fetch(`${API_URL}/weather/current`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location_name: locationName, language }),
        });

        if (!response.ok) throw new Error('Weather fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Failed to get current weather:', error);
        return null;
    }
}

/**
 * Get weather forecast for a location
 */
export async function getWeatherForecast(
    locationName: string,
    days: number = 7,
    language: string = 'en'
): Promise<WeatherResponse | null> {
    try {
        const response = await fetch(`${API_URL}/weather/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location_name: locationName, days, language }),
        });

        if (!response.ok) throw new Error('Forecast fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Failed to get forecast:', error);
        return null;
    }
}

/**
 * Get weather by coordinates (for geolocation)
 */
export async function getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    days: number = 7,
    language: string = 'en'
): Promise<WeatherResponse | null> {
    try {
        const response = await fetch(`${API_URL}/weather/coordinates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, days, language }),
        });

        if (!response.ok) throw new Error('Coordinates fetch failed');
        return await response.json();
    } catch (error) {
        console.error('Failed to get weather by coordinates:', error);
        return null;
    }
}
