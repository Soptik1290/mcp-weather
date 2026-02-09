import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Cloud, Droplets, Wind, Eye, Gauge } from 'lucide-react-native';

import { weatherService } from '../services';
import { useLocationStore, useSettingsStore } from '../stores';
import type { WeatherData, AmbientTheme } from '../types';

// Weather icon mapping (simplified - you can expand this)
const getWeatherEmoji = (code?: number): string => {
    if (!code) return '🌡️';
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '❄️';
    if (code >= 95) return '⛈️';
    return '🌡️';
};

export function HomeScreen() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [theme, setTheme] = useState<AmbientTheme>({
        name: 'default',
        gradient: ['#4A90D9', '#67B8DE'],
        is_dark: false,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { currentLocation } = useLocationStore();
    const { settings } = useSettingsStore();

    const fetchWeather = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const locationName = currentLocation?.name || 'Prague';

            const [weatherData, themeData] = await Promise.all([
                weatherService.getWeatherForecast(locationName, 7, settings.language),
                weatherService.getAmbientTheme(locationName),
            ]);

            setWeather({
                location: weatherData.location,
                current: weatherData.current,
                daily_forecast: weatherData.daily_forecast,
                hourly_forecast: weatherData.hourly_forecast,
                astronomy: weatherData.astronomy,
                ai_summary: weatherData.ai_summary,
                confidence_score: weatherData.confidence_score,
                sources_used: weatherData.sources_used,
                ambient_theme: themeData,
            });
            setTheme(themeData);
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError('Nepodařilo se načíst počasí');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, [currentLocation?.name]);

    const formatTemperature = (temp: number): string => {
        if (settings.temperature_unit === 'fahrenheit') {
            return `${Math.round(temp * 9 / 5 + 32)}°F`;
        }
        return `${Math.round(temp)}°C`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Načítám počasí...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const current = weather?.current;
    const textColor = theme.is_dark ? '#fff' : '#1a1a1a';
    const subTextColor = theme.is_dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
    const cardBg = theme.is_dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    return (
        <>
            <StatusBar
                barStyle={theme.is_dark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <LinearGradient
                colors={theme.gradient}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => fetchWeather(true)}
                                tintColor={textColor}
                            />
                        }
                    >
                        {/* Location Header */}
                        <View style={styles.header}>
                            <Text style={[styles.locationName, { color: textColor }]}>
                                {weather?.location.name}
                            </Text>
                            {weather?.location.country && (
                                <Text style={[styles.country, { color: subTextColor }]}>
                                    {weather.location.country}
                                </Text>
                            )}
                        </View>

                        {/* Current Weather */}
                        {current && (
                            <View style={styles.currentWeather}>
                                <Text style={styles.weatherEmoji}>
                                    {getWeatherEmoji(current.weather_code)}
                                </Text>
                                <Text style={[styles.temperature, { color: textColor }]}>
                                    {formatTemperature(current.temperature)}
                                </Text>
                                {current.weather_description && (
                                    <Text style={[styles.description, { color: subTextColor }]}>
                                        {current.weather_description}
                                    </Text>
                                )}
                                {current.feels_like !== undefined && (
                                    <Text style={[styles.feelsLike, { color: subTextColor }]}>
                                        Pocitově {formatTemperature(current.feels_like)}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Quick Stats */}
                        {current && (
                            <View style={[styles.statsGrid, { backgroundColor: cardBg }]}>
                                {current.humidity !== undefined && (
                                    <View style={styles.statItem}>
                                        <Droplets size={20} color={textColor} />
                                        <Text style={[styles.statValue, { color: textColor }]}>
                                            {current.humidity}%
                                        </Text>
                                        <Text style={[styles.statLabel, { color: subTextColor }]}>
                                            Vlhkost
                                        </Text>
                                    </View>
                                )}
                                {current.wind_speed !== undefined && (
                                    <View style={styles.statItem}>
                                        <Wind size={20} color={textColor} />
                                        <Text style={[styles.statValue, { color: textColor }]}>
                                            {Math.round(current.wind_speed)} km/h
                                        </Text>
                                        <Text style={[styles.statLabel, { color: subTextColor }]}>
                                            Vítr
                                        </Text>
                                    </View>
                                )}
                                {current.visibility !== undefined && (
                                    <View style={styles.statItem}>
                                        <Eye size={20} color={textColor} />
                                        <Text style={[styles.statValue, { color: textColor }]}>
                                            {current.visibility} km
                                        </Text>
                                        <Text style={[styles.statLabel, { color: subTextColor }]}>
                                            Viditelnost
                                        </Text>
                                    </View>
                                )}
                                {current.pressure !== undefined && (
                                    <View style={styles.statItem}>
                                        <Gauge size={20} color={textColor} />
                                        <Text style={[styles.statValue, { color: textColor }]}>
                                            {current.pressure} hPa
                                        </Text>
                                        <Text style={[styles.statLabel, { color: subTextColor }]}>
                                            Tlak
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* AI Summary */}
                        {weather?.ai_summary && (
                            <View style={[styles.aiCard, { backgroundColor: cardBg }]}>
                                <Text style={styles.aiIcon}>🤖</Text>
                                <Text style={[styles.aiSummary, { color: subTextColor }]}>
                                    {weather.ai_summary}
                                </Text>
                            </View>
                        )}

                        {/* Daily Forecast */}
                        {weather?.daily_forecast && weather.daily_forecast.length > 0 && (
                            <View style={[styles.forecastCard, { backgroundColor: cardBg }]}>
                                <Text style={[styles.sectionTitle, { color: textColor }]}>
                                    Týdenní předpověď
                                </Text>
                                {weather.daily_forecast.slice(0, 7).map((day, index) => (
                                    <View key={day.date} style={styles.forecastRow}>
                                        <Text style={[styles.forecastDay, { color: textColor }]}>
                                            {index === 0 ? 'Dnes' : new Date(day.date).toLocaleDateString('cs', { weekday: 'short' })}
                                        </Text>
                                        <Text style={styles.forecastEmoji}>
                                            {getWeatherEmoji(day.weather_code)}
                                        </Text>
                                        <Text style={[styles.forecastTemp, { color: textColor }]}>
                                            {Math.round(day.temperature_max)}° / {Math.round(day.temperature_min)}°
                                        </Text>
                                        {day.precipitation_probability !== undefined && (
                                            <Text style={[styles.forecastRain, { color: subTextColor }]}>
                                                💧 {day.precipitation_probability}%
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Confidence Score */}
                        {weather?.confidence_score !== undefined && (
                            <View style={styles.confidenceContainer}>
                                <Text style={[styles.confidenceText, { color: subTextColor }]}>
                                    Spolehlivost: {Math.round(weather.confidence_score * 100)}%
                                    ({weather.sources_used.length} zdrojů)
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4A90D9',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4A90D9',
        padding: 20,
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    header: {
        marginBottom: 20,
    },
    locationName: {
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: -1,
    },
    country: {
        fontSize: 18,
        marginTop: 4,
    },
    currentWeather: {
        alignItems: 'center',
        marginBottom: 30,
    },
    weatherEmoji: {
        fontSize: 72,
        marginBottom: 10,
    },
    temperature: {
        fontSize: 72,
        fontWeight: '200',
    },
    description: {
        fontSize: 18,
        marginTop: 8,
        textTransform: 'capitalize',
    },
    feelsLike: {
        fontSize: 14,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    aiCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    aiIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    aiSummary: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    forecastCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    forecastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.3)',
    },
    forecastDay: {
        width: 60,
        fontSize: 14,
        fontWeight: '500',
    },
    forecastEmoji: {
        fontSize: 24,
        marginHorizontal: 12,
    },
    forecastTemp: {
        flex: 1,
        fontSize: 14,
    },
    forecastRain: {
        fontSize: 12,
    },
    confidenceContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    confidenceText: {
        fontSize: 12,
    },
});

export default HomeScreen;
