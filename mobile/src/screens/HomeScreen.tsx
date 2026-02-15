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
import { Search, Settings } from 'lucide-react-native';
import { getWeatherIcon, getWeatherIconColor, t, shouldShowAurora, shouldUseDarkMode } from '../utils';

import { weatherService, widgetService } from '../services';
import { useLocationStore, useSettingsStore, useSubscriptionStore } from '../stores';
import { SearchScreen } from './SearchScreen';
import { SettingsScreen } from './SettingsScreen';
import { HourlyForecast, DailyForecast, WeatherDetails, TemperatureChart, WeatherSkeleton, DayDetailModal, AuroraCard, AstroCard, ExplainModal } from '../components';
import type { WeatherData, AmbientTheme } from '../types';
import { useColorScheme, Alert } from 'react-native';



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
    const [showSettings, setShowSettings] = useState(false);
    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [auroraData, setAuroraData] = useState<any>(null);
    const [astroData, setAstroData] = useState<any>(null);
    const [explainModalVisible, setExplainModalVisible] = useState(false);
    const [explainLoading, setExplainLoading] = useState(false);
    const [explainData, setExplainData] = useState<{ explanation: string; sources: any[] }>({ explanation: '', sources: [] });

    // ... existing code ...



    const { currentLocation } = useLocationStore();
    const { settings } = useSettingsStore();
    const { tier } = useSubscriptionStore();
    const systemColorScheme = useColorScheme();
    const lang = settings.language;

    const fetchWeather = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const locationName = currentLocation?.name || 'Prague';

            const [weatherData, themeData, aurora] = await Promise.all([
                weatherService.getWeatherForecast(locationName, 7, settings.language, tier, settings.confidence_bias),
                weatherService.getAmbientTheme(locationName),
                weatherService.getAuroraForecast(
                    currentLocation?.latitude || 50.0,
                    settings.language
                ).catch(() => null),
            ]);

            // Fetch AstroPack if Ultra
            if (tier === 'ultra' && currentLocation) {
                weatherService.getAstroPack(currentLocation.latitude, currentLocation.longitude, settings.language)
                    .then(res => setAstroData(res))
                    .catch(e => console.log('Astro fetch failed', e));
            } else {
                setAstroData(null);
            }

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
            setAuroraData(aurora);

            // Update Android Widget
            if (weatherData.current) {
                // Get localized description from wmo code
                const weatherCode = weatherData.current.weather_code || 0;
                const localizedDesc = t(`wmo_${weatherCode}`, lang);

                widgetService.updateWidget({
                    temperature: Math.round(weatherData.current.temperature),
                    weatherCode: weatherCode,
                    city: locationName,
                    description: localizedDesc,
                    updatedAt: Date.now(),
                    isNight: themeData.is_dark,
                    gradientStart: themeData.gradient[0] || '#4facfe',
                    gradientEnd: themeData.gradient[1] || '#00f2fe',
                    hourly: weatherData.hourly_forecast?.slice(0, 4).map(h => ({
                        time: new Date(h.time).getHours() + ':00',
                        temperature: Math.round(h.temperature),
                        weatherCode: h.weather_code || 0
                    })),
                    daily: weatherData.daily_forecast?.slice(0, 3).map(d => ({
                        date: new Date(d.date).toLocaleDateString(lang, { weekday: 'short' }),
                        maxTemp: Math.round(d.temperature_max),
                        minTemp: Math.round(d.temperature_min),
                        weatherCode: d.weather_code || 0
                    })),
                    astronomy: {
                        sunrise: weatherData.astronomy?.sunrise || '',
                        sunset: weatherData.astronomy?.sunset || '',
                        moonPhase: weatherData.astronomy?.moon_phase_name || ''
                    },
                    aurora: aurora ? {
                        kp: aurora.current_kp || 0,
                        visibilityProb: aurora.visibility_probability || 0,
                        maxKp: aurora.max_forecast_kp || 0,
                        maxProb: aurora.max_visibility_probability || 0,
                        bestTime: aurora.best_viewing_time || '',
                        bestKp: aurora.best_viewing_kp || 0,
                        // Take first 12 forecast items (e.g. 12 hours/intervals)
                        forecast: aurora.forecast?.slice(0, 12).map((f: any) => f.kp) || []
                    } : undefined
                });
            }
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError(t('error_load', lang));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const [notifiedAurora, setNotifiedAurora] = useState(false);

    useEffect(() => {
        if (settings.aurora_notifications && auroraData && !notifiedAurora) {
            const prob = auroraData.visibility_probability || 0;
            if (prob > 40) {
                Alert.alert(
                    t('aurora_alerts', lang),
                    `${t('aurora_visible', lang) || 'Aurora visible!'} (${prob}%)`
                );
                setNotifiedAurora(true);
            }
        }
    }, [auroraData, settings.aurora_notifications]);

    useEffect(() => {
        fetchWeather();
    }, [currentLocation?.name, lang, tier, settings.confidence_bias]);

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
    const isDark = shouldUseDarkMode(settings.theme_mode, theme.name, systemColorScheme === 'dark');
    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subTextColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)';
    const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
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
                            <View style={styles.headerButtons}>
                                <TouchableOpacity
                                    style={[styles.searchButton, { backgroundColor: cardBg }]}
                                    onPress={() => setShowSettings(true)}
                                >
                                    <Settings size={22} color={textColor} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.searchButton, { backgroundColor: cardBg }]}
                                    onPress={() => setShowSearch(true)}
                                >
                                    <Search size={22} color={textColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Current Weather */}
                        {current && (
                            <View style={styles.currentWeather}>
                                <View style={styles.weatherIconContainer}>
                                    {(() => {
                                        const WeatherIcon = getWeatherIcon(current.weather_code);
                                        const iconColor = getWeatherIconColor(current.weather_code, theme.is_dark);
                                        return <WeatherIcon size={80} color={iconColor} strokeWidth={1.5} />;
                                    })()}
                                </View>
                                <Text style={[styles.temperature, { color: textColor }]}>
                                    {formatTemperature(current.temperature)}
                                </Text>
                                <Text style={[styles.description, { color: subTextColor }]}>
                                    {t(`wmo_${current.weather_code}`, lang)}
                                </Text>


                                {tier === 'ultra' && (
                                    <TouchableOpacity
                                        style={[styles.explainBtn, { backgroundColor: cardBg }]}
                                        onPress={async () => {
                                            setExplainModalVisible(true);
                                            setExplainLoading(true);
                                            try {
                                                const data = await weatherService.explainWeather(
                                                    weather?.location.name || '',
                                                    lang,
                                                    tier,
                                                    settings.confidence_bias
                                                );
                                                setExplainData({
                                                    explanation: data.explanation,
                                                    sources: data.sources_data || []
                                                });
                                            } catch (e) {
                                                setExplainData({
                                                    explanation: t('explain_error', lang),
                                                    sources: []
                                                });
                                            } finally {
                                                setExplainLoading(false);
                                            }
                                        }}
                                    >
                                        <Text style={[styles.explainText, { color: textColor }]}>
                                            {t('explain_btn', lang)}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {current.feels_like !== undefined && (
                                    <Text style={[styles.feelsLike, { color: subTextColor }]}>
                                        {t('feels_like', lang)} {formatTemperature(current.feels_like)}
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
                                isDark={isDark}
                                formatTemperature={formatTemperature}
                                language={lang}
                                timeFormat={settings.time_format}
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
                                        {t('ai_summary', lang)}
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
                                isDark={isDark}
                                onDayPress={(day) => setSelectedDay(day)}
                                language={lang}
                            />
                        )}

                        {/* Aurora Card */}
                        {shouldShowAurora(
                            settings.aurora_display,
                            auroraData?.visibility_probability
                        ) && (
                                <AuroraCard
                                    data={auroraData}
                                    textColor={textColor}
                                    subTextColor={subTextColor}
                                    cardBg={cardBg}
                                    isDark={isDark}
                                    locationName={weather?.location.name}
                                    language={lang}
                                    timeFormat={settings.time_format}
                                />
                            )}

                        {/* AstroPack Card (Ultra) */}
                        {tier === 'ultra' && astroData && (
                            <AstroCard
                                data={astroData}
                                textColor={textColor}
                                subTextColor={subTextColor}
                                cardBg={cardBg}
                                isDark={isDark}
                                language={lang}
                            />
                        )}

                        {/* Confidence Score */}
                        {weather?.confidence_score !== undefined && (
                            <View style={styles.confidenceContainer}>
                                <Text style={[styles.confidenceText, { color: subTextColor }]}>
                                    {t('reliability', lang)}: {Math.round(weather.confidence_score * 100)}%
                                    ({weather.sources_used?.length || 0} {t('sources', lang)})
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
                    language={settings.language}
                />
            </Modal>

            {/* Day Detail Modal */}
            <DayDetailModal
                visible={!!selectedDay}
                onClose={() => setSelectedDay(null)}
                day={selectedDay}
                themeGradient={theme.gradient}
                isDark={theme.is_dark}
                language={settings.language}
                timeFormat={settings.time_format}
                temperatureUnit={settings.temperature_unit}
            />

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <SettingsScreen
                    onClose={() => setShowSettings(false)}
                    themeGradient={theme.gradient}
                    isDark={theme.is_dark}
                />
            </Modal>

            {/* AI Explanation Modal */}
            <ExplainModal
                visible={explainModalVisible}
                onClose={() => setExplainModalVisible(false)}
                loading={explainLoading}
                explanation={explainData.explanation}
                sources={explainData.sources}
                themeGradient={theme.gradient}
                isDark={theme.is_dark}
                language={lang}
            />
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
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
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
    weatherIconContainer: {
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
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
    explainBtn: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    explainText: {
        fontSize: 14,
        fontWeight: '600',
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
