import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Search } from 'lucide-react-native';

import { weatherService } from '../services';
import { useLocationStore, useSettingsStore } from '../stores';
import { SearchScreen } from './SearchScreen';
import { HourlyForecast, DailyForecast, WeatherDetails, TemperatureChart, WeatherSkeleton } from '../components';
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
    const [showSearch, setShowSearch] = useState(false);

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
        const cardBg = 'rgba(255,255,255,0.1)';
        return (
            <>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <LinearGradient
                    colors={['#4A90D9', '#67B8DE', '#8BC7E8']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <SafeAreaView style={styles.container}>
                        <WeatherSkeleton cardBg={cardBg} />
                    </SafeAreaView>
                </LinearGradient>
            </>
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
                            <View style={styles.headerLeft}>
                                <Text style={[styles.locationName, { color: textColor }]}>
                                    {weather?.location.name}
                                </Text>
                                {weather?.location.country && (
                                    <Text style={[styles.country, { color: subTextColor }]}>
                                        {weather.location.country}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[styles.searchButton, { backgroundColor: cardBg }]}
                                onPress={() => setShowSearch(true)}
                            >
                                <Search size={22} color={textColor} />
                            </TouchableOpacity>
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

                        {/* Hourly Forecast */}
                        {weather?.hourly_forecast && weather.hourly_forecast.length > 0 && (
                            <HourlyForecast
                                data={weather.hourly_forecast}
                                textColor={textColor}
                                subTextColor={subTextColor}
                                cardBg={cardBg}
                                formatTemperature={formatTemperature}
                            />
                        )}

                        {/* Temperature Chart */}
                        {weather?.hourly_forecast && weather.hourly_forecast.length > 0 && (
                            <TemperatureChart
                                data={weather.hourly_forecast}
                                textColor={textColor}
                                cardBg={cardBg}
                            />
                        )}

                        {/* Weather Details */}
                        {current && (
                            <WeatherDetails
                                humidity={current.humidity}
                                windSpeed={current.wind_speed}
                                visibility={current.visibility}
                                pressure={current.pressure}
                                feelsLike={current.feels_like}
                                sunrise={weather?.astronomy?.sunrise}
                                sunset={weather?.astronomy?.sunset}
                                textColor={textColor}
                                subTextColor={subTextColor}
                                cardBg={cardBg}
                                formatTemperature={formatTemperature}
                            />
                        )}

                        {/* AI Summary */}
                        {weather?.ai_summary && (
                            <View style={[styles.aiCard, { backgroundColor: cardBg }]}>
                                <Text style={styles.aiIcon}>🤖</Text>
                                <View style={styles.aiContent}>
                                    <Text style={[styles.aiTitle, { color: textColor }]}>
                                        AI shrnutí
                                    </Text>
                                    <Text style={[styles.aiSummary, { color: subTextColor }]}>
                                        {weather.ai_summary}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Daily Forecast */}
                        {weather?.daily_forecast && weather.daily_forecast.length > 0 && (
                            <DailyForecast
                                data={weather.daily_forecast}
                                textColor={textColor}
                                subTextColor={subTextColor}
                                cardBg={cardBg}
                            />
                        )}

                        {/* Confidence Score */}
                        {weather?.confidence_score !== undefined && (
                            <View style={styles.confidenceContainer}>
                                <Text style={[styles.confidenceText, { color: subTextColor }]}>
                                    Spolehlivost: {Math.round(weather.confidence_score * 100)}%
                                    ({weather.sources_used?.length || 0} zdrojů)
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>

            {/* Search Modal */}
            <Modal
                visible={showSearch}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <SearchScreen
                    onClose={() => setShowSearch(false)}
                    themeGradient={theme.gradient}
                    isDark={theme.is_dark}
                />
            </Modal>
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
        fontSize: 18,
        fontWeight: '300',
        letterSpacing: 0.5,
    },
    loadingEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    loadingSpinner: {
        marginBottom: 16,
    },
    loadingSubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 4,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    searchButton: {
        padding: 12,
        borderRadius: 12,
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
        fontSize: 24,
        marginRight: 14,
    },
    aiContent: {
        flex: 1,
    },
    aiTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    aiSummary: {
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
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
