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
    RainCard,
    SunTimesCard,
    MoonPhaseCard,
    SearchBar,
    HamburgerMenu,
    SideMenu,
    AmbientBackground,
    AuroraCard,
} from '@/components/weather';
import { type WeatherResponse } from '@/lib/types';
import { THEMES, isDarkTheme, type AmbientTheme, type ThemeName } from '@/lib/themes';
import { getWeatherForecast, getAuroraData, getWeatherByCoordinates } from '@/lib/api';
import { useSettings } from '@/lib/settings';

const STORAGE_KEY = 'weather-dashboard-data';

export function WeatherDashboard() {
    const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
    const [auroraData, setAuroraData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTheme, setCurrentTheme] = useState<AmbientTheme>(THEMES['cloudy']);

    const { shouldShowAurora, shouldUseDarkMode, language } = useSettings();
    const isDark = shouldUseDarkMode(currentTheme.theme);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setWeatherData(parsed);
                if (parsed.ambient_theme?.theme) {
                    const themeName = parsed.ambient_theme.theme as ThemeName;
                    if (THEMES[themeName]) setCurrentTheme(THEMES[themeName]);
                }
            }
        } catch (e) {
            console.error('Failed to load cached weather:', e);
        }
    }, []);

    // Save to localStorage when data changes
    useEffect(() => {
        if (weatherData) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(weatherData));
        }
    }, [weatherData]);

    // Fetch aurora data
    const fetchAuroraData = async (latitude: number) => {
        try {
            const data = await getAuroraData(latitude, language);
            if (data) {
                setAuroraData(data);
            }
        } catch (err) {
            console.error('Failed to fetch aurora data:', err);
        }
    };

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Try to fetch real data from API
            const data = await getWeatherForecast(query, 7, language);

            if (data) {
                setWeatherData(data);
                // Update theme based on API response
                if (data.ambient_theme?.theme) {
                    const themeName = data.ambient_theme.theme as ThemeName;
                    if (THEMES[themeName]) {
                        setCurrentTheme(THEMES[themeName]);
                    }
                }
                // Fetch aurora data for this location
                fetchAuroraData(data.location.latitude);
            } else {
                // API not available
                setError('API not available');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to fetch weather data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationDetected = async (lat: number, lon: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getWeatherByCoordinates(lat, lon, 7, language);

            if (data) {
                setWeatherData(data);
                if (data.ambient_theme?.theme) {
                    const themeName = data.ambient_theme.theme as ThemeName;
                    if (THEMES[themeName]) {
                        setCurrentTheme(THEMES[themeName]);
                    }
                }
                fetchAuroraData(lat);
            } else {
                setError('API not available');
            }
        } catch (err) {
            console.error('Location error:', err);
            setError('Failed to fetch weather for your location');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-detect location on mount if no cached data
    useEffect(() => {
        const detectLocation = async () => {
            // Only auto-detect if we don't have weather data yet
            if (weatherData) {
                setIsLoading(false);
                return;
            }

            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                setIsLoading(true);
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const data = await getWeatherByCoordinates(latitude, longitude, 7, language);
                            if (data) {
                                setWeatherData(data);
                                if (data.ambient_theme?.theme) {
                                    const themeName = data.ambient_theme.theme as ThemeName;
                                    if (THEMES[themeName]) {
                                        setCurrentTheme(THEMES[themeName]);
                                    }
                                }
                                fetchAuroraData(latitude);
                            }
                        } catch (err) {
                            console.error('Failed to fetch weather for location:', err);
                            setError('Failed to fetch weather');
                        }
                        setIsLoading(false);
                    },
                    (err) => {
                        console.log('Geolocation not available or denied:', err.message);
                        setIsLoading(false);
                    },
                    { timeout: 10000, enableHighAccuracy: false }
                );
            } else {
                setIsLoading(false);
            }
        };

        // Short delay to allow local storage load to complete first
        const timer = setTimeout(detectLocation, 100);
        return () => clearTimeout(timer);
    }, [weatherData, language]);

    // Menu state  
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Loading State
    if (isLoading && !weatherData) {
        return (
            <AmbientBackground theme={THEMES['cloudy']}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    <p className="ml-4 text-white text-lg">Loading weather...</p>
                </div>
            </AmbientBackground>
        );
    }

    // Empty State (Search)
    if (!weatherData) {
        return (
            <AmbientBackground theme={THEMES['cloudy']}>
                <div className="min-h-screen p-6 flex flex-col items-center justify-center">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <h1 className="text-4xl font-bold text-white mb-2">Weather AI</h1>
                        <p className="text-white/70 mb-8">Enter a city or enable location to see the forecast.</p>
                        <SearchBar
                            onSearch={handleSearch}
                            onLocationDetected={handleLocationDetected}
                            isLoading={isLoading}
                            isDark={false}
                        />
                    </div>
                </div>
            </AmbientBackground>
        );
    }

    return (
        <AmbientBackground theme={currentTheme}>
            {/* Side Menu */}
            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                isDark={isDark}
            />

            <div className="min-h-screen p-6">
                {/* Header with search and menu */}
                <header className="flex items-center justify-between mb-8">
                    <HamburgerMenu isDark={isDark} onOpenMenu={() => setIsMenuOpen(true)} />
                    <div className="flex-1 max-w-md mx-4">
                        <SearchBar
                            onSearch={handleSearch}
                            onLocationDetected={handleLocationDetected}
                            isLoading={isLoading}
                            isDark={isDark}
                        />
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
                                originalLocationName={weatherData.location.original_name}
                                country={weatherData.location.country}
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
                                hourlyData={weatherData.hourly_forecast}
                            />
                            <HumidityCard
                                humidity={weatherData.current?.humidity}
                                isDark={isDark}
                                hourlyData={weatherData.hourly_forecast}
                            />
                            <UVIndexCard
                                uvIndex={weatherData.current?.uv_index}
                                isDark={isDark}
                                hourlyData={weatherData.hourly_forecast}
                            />
                            <RainCard
                                probability={weatherData.daily_forecast?.[0]?.precipitation_probability}
                                amount={weatherData.daily_forecast?.[0]?.precipitation_sum}
                                snowAmount={weatherData.daily_forecast?.[0]?.snowfall_sum}
                                weatherCode={weatherData.daily_forecast?.[0]?.weather_code}
                                isDark={isDark}
                                hourlyData={weatherData.hourly_forecast}
                            />
                        </div>

                        {/* Sunrise/Sunset & Moon Phase */}
                        <div className="grid grid-cols-2 gap-3">
                            <SunTimesCard
                                sunrise={weatherData.astronomy?.sunrise}
                                sunset={weatherData.astronomy?.sunset}
                                isDark={isDark}
                            />
                            <MoonPhaseCard
                                moonPhase={weatherData.astronomy?.moon_phase}
                                isDark={isDark}
                            />
                        </div>

                        {/* Aurora Forecast - conditional based on settings */}
                        {shouldShowAurora(auroraData?.visibility_probability ?? 0) && (
                            <AuroraCard
                                data={auroraData}
                                isDark={isDark}
                                locationName={weatherData.location.name}
                            />
                        )}

                        {/* 7-Day Forecast */}
                        {weatherData.daily_forecast && (
                            <DailyForecastCard
                                forecast={weatherData.daily_forecast}
                                hourlyForecast={weatherData.hourly_forecast}
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
