'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CurrentWeatherCard,
    DailyForecastCard,
    HourlyForecastCard,
    WindCard,
    HumidityCard,
    UVIndexCard,
    SunTimesCard,
    SearchBar,
    HamburgerMenu,
    AmbientBackground,
} from '@/components/weather';
import { type WeatherResponse } from '@/lib/types';
import { THEMES, isDarkTheme, type AmbientTheme, type ThemeName } from '@/lib/themes';
import { getWeatherForecast } from '@/lib/api';

// Demo data for initial display (fallback when API unavailable)
const DEMO_DATA: WeatherResponse = {
    location: {
        name: 'Prague',
        latitude: 50.08804,
        longitude: 14.42076,
        country: 'Czechia',
        timezone: 'Europe/Prague',
    },
    current: {
        temperature: -1,
        feels_like: -5,
        humidity: 85,
        wind_speed: 15,
        wind_direction: 270,
        weather_code: 3,
        weather_description: 'Overcast',
        uv_index: 1,
        pressure: 1015,
        cloud_cover: 90,
    },
    daily_forecast: [
        { date: '2026-01-24', temperature_max: 2, temperature_min: -3, weather_code: 3, weather_description: 'Overcast' },
        { date: '2026-01-25', temperature_max: 4, temperature_min: -1, weather_code: 61, weather_description: 'Slight rain' },
        { date: '2026-01-26', temperature_max: 3, temperature_min: 0, weather_code: 2, weather_description: 'Partly cloudy' },
        { date: '2026-01-27', temperature_max: 5, temperature_min: 1, weather_code: 1, weather_description: 'Mainly clear' },
        { date: '2026-01-28', temperature_max: 6, temperature_min: 2, weather_code: 0, weather_description: 'Clear sky' },
        { date: '2026-01-29', temperature_max: 4, temperature_min: -1, weather_code: 71, weather_description: 'Slight snow' },
        { date: '2026-01-30', temperature_max: 1, temperature_min: -4, weather_code: 73, weather_description: 'Moderate snow' },
    ],
    hourly_forecast: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() + i * 3600000).toISOString(),
        temperature: Math.round(-1 + Math.sin(i / 4) * 3),
        weather_code: i < 8 ? 3 : i < 16 ? 2 : 1,
        precipitation_probability: Math.max(0, 30 - i * 2),
    })),
    astronomy: {
        sunrise: '2026-01-24T07:30:00',
        sunset: '2026-01-24T16:45:00',
    },
    ai_summary: "It's a cold, overcast day in Prague. Bundle up warmly as temperatures hover around freezing. Light rain expected tomorrow, with possible snow by the weekend.",
    confidence: 0.92,
    ambient_theme: { theme: 'cloudy', gradient: ['#8e9eab', '#c5d5e4', '#eef2f3'], effect: null },
};

export function WeatherDashboard() {
    const [weatherData, setWeatherData] = useState<WeatherResponse>(DEMO_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTheme, setCurrentTheme] = useState<AmbientTheme>(
        THEMES[(weatherData.ambient_theme?.theme as ThemeName) || 'cloudy']
    );

    const isDark = isDarkTheme(currentTheme.theme);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Try to fetch real data from API
            const data = await getWeatherForecast(query, 7, 'en');

            if (data) {
                setWeatherData(data);
                // Update theme based on API response
                if (data.ambient_theme?.theme) {
                    const themeName = data.ambient_theme.theme as ThemeName;
                    if (THEMES[themeName]) {
                        setCurrentTheme(THEMES[themeName]);
                    }
                }
            } else {
                // API not available, use demo with location name
                setError('API not available - showing demo data');
                setWeatherData({
                    ...DEMO_DATA,
                    location: { ...DEMO_DATA.location, name: query },
                });
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to fetch weather data');
            setWeatherData({
                ...DEMO_DATA,
                location: { ...DEMO_DATA.location, name: query },
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AmbientBackground theme={currentTheme}>
            <div className="min-h-screen p-6">
                {/* Header with search and menu */}
                <header className="flex items-center justify-between mb-8">
                    <HamburgerMenu isDark={isDark} />
                    <div className="flex-1 max-w-md mx-4">
                        <SearchBar onSearch={handleSearch} isLoading={isLoading} isDark={isDark} />
                    </div>
                    <div className="w-10" /> {/* Spacer for balance */}
                </header>

                {/* Main 40/60 Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 max-w-7xl mx-auto">
                    {/* Left Panel - 40% - Current Weather */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden"
                    >
                        {weatherData.current && (
                            <CurrentWeatherCard
                                current={weatherData.current}
                                locationName={weatherData.location.name}
                                astronomy={weatherData.astronomy}
                                aiSummary={weatherData.ai_summary}
                                isDark={isDark}
                            />
                        )}
                    </motion.div>

                    {/* Right Panel - 60% - Detailed Info */}
                    <div className="space-y-4">
                        {/* Hourly Forecast */}
                        {weatherData.hourly_forecast && (
                            <HourlyForecastCard
                                forecast={weatherData.hourly_forecast}
                                isDark={isDark}
                            />
                        )}

                        {/* Detail Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <WindCard
                                speed={weatherData.current?.wind_speed}
                                direction={weatherData.current?.wind_direction}
                                isDark={isDark}
                            />
                            <HumidityCard
                                humidity={weatherData.current?.humidity}
                                isDark={isDark}
                            />
                            <UVIndexCard
                                uvIndex={weatherData.current?.uv_index}
                                isDark={isDark}
                            />
                            <div className="col-span-2 md:col-span-1">
                                {/* Pressure card or another detail */}
                            </div>
                        </div>

                        {/* Sunrise/Sunset */}
                        <SunTimesCard
                            sunrise={weatherData.astronomy?.sunrise}
                            sunset={weatherData.astronomy?.sunset}
                            isDark={isDark}
                        />

                        {/* 7-Day Forecast */}
                        {weatherData.daily_forecast && (
                            <DailyForecastCard
                                forecast={weatherData.daily_forecast}
                                isDark={isDark}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className={`text-center mt-8 text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    <p>AI-powered forecast • Confidence: {Math.round((weatherData.confidence || 0) * 100)}%</p>
                </footer>
            </div>
        </AmbientBackground>
    );
}
