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
import Svg, { Circle, G, Polygon, Defs, ClipPath, Path, Rect, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Search, Settings } from 'lucide-react-native';
import { getWeatherIcon, getWeatherIconColor, t, shouldShowAurora, shouldUseDarkMode, getLocalizedCity, getLocalizedCountry, triggerHaptic } from '../utils';

import { weatherService, widgetService } from '../services';
import { useLocationStore, useSettingsStore, useSubscriptionStore } from '../stores';
import { SearchScreen } from './SearchScreen';
import { SettingsScreen } from './SettingsScreen';
import { HourlyForecast, DailyForecast, WeatherDetails, TemperatureChart, WeatherSkeleton, DayDetailModal, AuroraCard, AstroCard, ExplainModal, AnimatedCard, AnimatedPressable, MoonPhaseCard } from '../components';
import type { WeatherData, AmbientTheme } from '../types';
import { useColorScheme, Alert, useWindowDimensions } from 'react-native';



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
    const { width } = useWindowDimensions();
    const lang = settings.language;
    const isTablet = width >= 768;

    const fetchWeather = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const locationName = currentLocation?.name || '';

            const [weatherData, themeData, aurora, astro] = await Promise.all([
                weatherService.getWeatherForecast(locationName, 7, settings.language, tier, settings.confidence_bias),
                weatherService.getAmbientTheme(locationName),
                weatherService.getAuroraForecast(
                    currentLocation?.latitude || 50.0,
                    settings.language
                ).catch(() => null),
                // Fetch AstroPack in parallel (Ultra only, otherwise null)
                (tier === 'ultra' && currentLocation)
                    ? weatherService.getAstroPack(currentLocation.latitude, currentLocation.longitude, settings.language)
                        .catch(e => { console.log('Astro fetch failed', e); return null; })
                    : Promise.resolve(null),
            ]);

            setAstroData(astro);

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
                model_agreement: weatherData.model_agreement,
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
    const isDark = shouldUseDarkMode(settings.theme_mode, theme.name, systemColorScheme === 'dark', theme.is_dark, theme.gradient);
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
                                onRefresh={() => {
                                    triggerHaptic('impactLight');
                                    fetchWeather(true);
                                }}
                                tintColor={textColor}
                            />
                        }
                    >
                        {/* Header Buttons Only (Tablet) or Full Header (Phone) */}
                        {isTablet ? (
                            <View style={[styles.header, { justifyContent: 'flex-end', marginBottom: 10 }]}>
                                <View style={styles.headerButtons}>
                                    <TouchableOpacity
                                        style={[styles.searchButton, { backgroundColor: cardBg }]}
                                        onPress={() => {
                                            triggerHaptic('impactLight');
                                            setShowSettings(true);
                                        }}
                                    >
                                        <Settings size={22} color={textColor} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.searchButton, { backgroundColor: cardBg }]}
                                        onPress={() => {
                                            triggerHaptic('impactLight');
                                            setShowSearch(true);
                                        }}
                                    >
                                        <Search size={22} color={textColor} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.header}>
                                <View style={styles.headerLeft}>
                                    <Text style={[styles.locationName, { color: textColor }]}>
                                        {getLocalizedCity(weather?.location.name, lang)}
                                    </Text>
                                    {weather?.location.country && (
                                        <Text style={[styles.country, { color: subTextColor }]}>
                                            {getLocalizedCountry(weather.location.country, lang)}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.headerButtons}>
                                    <TouchableOpacity
                                        style={[styles.searchButton, { backgroundColor: cardBg }]}
                                        onPress={() => {
                                            triggerHaptic('impactLight');
                                            setShowSettings(true);
                                        }}
                                    >
                                        <Settings size={22} color={textColor} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.searchButton, { backgroundColor: cardBg }]}
                                        onPress={() => {
                                            triggerHaptic('impactLight');
                                            setShowSearch(true);
                                        }}
                                    >
                                        <Search size={22} color={textColor} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {isTablet ? (
                            <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
                                {/* Left Column Container */}
                                <View style={{ flex: 1.1, gap: 16 }}>
                                    {/* Left Column: Hero Card */}
                                    <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 32, justifyContent: 'space-between' }}>

                                        <View>
                                            <Text style={{ fontSize: 48, fontWeight: '800', letterSpacing: -1, color: textColor }}>
                                                {getLocalizedCity(weather?.location.name, lang)}
                                            </Text>
                                            {current?.weather_code !== undefined && (
                                                <Text style={{ fontSize: 20, marginTop: 4, color: subTextColor }}>
                                                    {t(`wmo_${current.weather_code}`, lang)}
                                                </Text>
                                            )}
                                        </View>

                                        {current && (
                                            <View style={{ marginVertical: 40, alignItems: 'flex-start' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    {(() => {
                                                        const WeatherIcon = getWeatherIcon(current.weather_code);
                                                        const iconColor = getWeatherIconColor(current.weather_code, theme.is_dark);
                                                        return <WeatherIcon size={140} color={iconColor} strokeWidth={1.2} />;
                                                    })()}
                                                    <Text style={{ fontSize: 130, fontWeight: '200', color: textColor, marginLeft: 24, letterSpacing: -4, includeFontPadding: false }}>
                                                        {formatTemperature(current.temperature)}
                                                    </Text>
                                                </View>

                                                {current.feels_like !== undefined && (
                                                    <Text style={{ fontSize: 20, marginTop: 12, color: subTextColor, marginLeft: 16 }}>
                                                        {t('feels_like', lang)} {formatTemperature(current.feels_like)}
                                                    </Text>
                                                )}

                                                {tier === 'ultra' && (
                                                    <TouchableOpacity
                                                        style={[styles.explainBtn, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 24, marginLeft: 16 }]}
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
                                            </View>
                                        )}

                                        {current && (
                                            <View style={{ marginTop: 'auto', gap: 16 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    {current.humidity != null && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <Text style={{ fontSize: 18, color: textColor, marginRight: 8 }}>💧</Text>
                                                            <Text style={{ fontSize: 16, color: subTextColor }}>{current.humidity}%</Text>
                                                        </View>
                                                    )}
                                                    {current.wind_speed != null && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <Text style={{ fontSize: 18, color: textColor, marginRight: 8 }}>🪁</Text>
                                                            <Text style={{ fontSize: 16, color: subTextColor }}>{Math.round(current.wind_speed)} km/h</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    {current.visibility != null && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <Text style={{ fontSize: 18, color: textColor, marginRight: 8 }}>👁</Text>
                                                            <Text style={{ fontSize: 16, color: subTextColor }}>{current.visibility > 1000 ? `${Math.round(current.visibility / 1000)} km` : `${current.visibility} m`}</Text>
                                                        </View>
                                                    )}
                                                    {current.pressure != null && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <Text style={{ fontSize: 18, color: textColor, marginRight: 8 }}>⏲</Text>
                                                            <Text style={{ fontSize: 16, color: subTextColor }}>{Math.round(current.pressure)} hPa</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}

                                        {weather?.confidence_score !== undefined && (
                                            <View style={[styles.confidenceContainer, { marginTop: 20, marginBottom: 0 }]}>
                                                <Text style={[styles.confidenceText, { color: subTextColor }]}>
                                                    {t('reliability', lang)}: {Math.round(weather.confidence_score * 100)}%
                                                    ({weather.sources_used?.length || 0} {t('sources', lang)})
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Tablet AI Summary (Under Left Card) — Pro/Ultra only */}
                                    {weather?.ai_summary && tier !== 'free' && (
                                        <View style={[styles.aiCard, { backgroundColor: cardBg, marginTop: 0, marginBottom: 0 }]}>
                                            <Text style={styles.aiIcon}>🤖</Text>
                                            <View style={styles.aiContent}>
                                                <Text style={[styles.aiTitle, { color: textColor }]}>
                                                    {t('ai_summary', lang)}
                                                </Text>
                                                <Text style={[styles.aiSummary, { color: subTextColor, fontSize: 16, lineHeight: 24 }]}>
                                                    {weather.ai_summary}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Model Divergence Alert */}
                                    {weather?.model_agreement?.alert && (
                                        <View style={[styles.divergenceAlert, { backgroundColor: isDark ? 'rgba(255,165,0,0.15)' : 'rgba(255,140,0,0.1)' }]}>
                                            <Text style={[styles.divergenceText, { color: isDark ? '#FFB347' : '#CC7000' }]}>
                                                {weather.model_agreement.alert}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Moon Phase Card — All tiers */}
                                    {weather?.astronomy && (
                                        <MoonPhaseCard
                                            astronomy={weather.astronomy}
                                            textColor={textColor}
                                            subTextColor={subTextColor}
                                            cardBg={cardBg}
                                            isDark={isDark}
                                            language={lang}
                                            timeFormat={settings.time_format}
                                        />
                                    )}

                                    {/* Daily Forecast (Moved to Left Column on Tablet for spatial balance) */}
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
                                </View>

                                {/* Right Column */}
                                <View style={{ flex: 1.5, gap: 16 }}>
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

                                    {/* 4 Square Layout for Tablet */}
                                    {current && (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                            <View style={{ flex: 1, minWidth: '22%', backgroundColor: cardBg, borderRadius: 24, padding: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'space-between', aspectRatio: 1 }}>
                                                <Text style={{ fontSize: 13, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>{t('wind', lang)}</Text>
                                                <View style={{ height: 56, width: 56, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Svg viewBox="0 0 100 100" width="100%" height="100%">
                                                        {/* Outer ring */}
                                                        <Circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)'} strokeWidth="2" />
                                                        {/* Arrow */}
                                                        <G rotation={current.wind_direction || 0} origin="50, 50">
                                                            <Polygon points="50,12 44,50 50,45 56,50" fill={isDark ? '#60a5fa' : '#3b82f6'} />
                                                            <Polygon points="50,88 44,50 50,55 56,50" fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} />
                                                        </G>
                                                        {/* Center dot */}
                                                        <Circle cx="50" cy="50" r="5" fill={isDark ? '#60a5fa' : '#3b82f6'} />
                                                    </Svg>
                                                </View>
                                                <Text style={{ fontSize: 24, fontWeight: '600', color: textColor }}>{Math.round(current.wind_speed || 0)} <Text style={{ fontSize: 13, fontWeight: '400' }}>km/h</Text></Text>
                                            </View>

                                            <View style={{ flex: 1, minWidth: '22%', backgroundColor: cardBg, borderRadius: 24, padding: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'space-between', aspectRatio: 1 }}>
                                                <Text style={{ fontSize: 13, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>{t('humidity', lang)}</Text>
                                                <View style={{ height: 56, width: 42, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Svg viewBox="0 0 60 80" width="100%" height="100%">
                                                        <Defs>
                                                            <ClipPath id="dropletClip">
                                                                <Path d="M30 5 C30 5, 5 35, 5 50 C5 65, 15 75, 30 75 C45 75, 55 65, 55 50 C55 35, 30 5, 30 5 Z" />
                                                            </ClipPath>
                                                        </Defs>
                                                        <Path d="M30 5 C30 5, 5 35, 5 50 C5 65, 15 75, 30 75 C45 75, 55 65, 55 50 C55 35, 30 5, 30 5 Z" fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)'} strokeWidth="2" />
                                                        <Rect x="0" y={75 - (Math.min(current.humidity || 0, 100) * 0.7)} width="60" height={(Math.min(current.humidity || 0, 100) * 0.7) + 5} fill={isDark ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.4)'} clipPath="url(#dropletClip)" />
                                                    </Svg>
                                                </View>
                                                <Text style={{ fontSize: 28, fontWeight: '600', color: textColor }}>{current.humidity || 0}%</Text>
                                            </View>

                                            <View style={{ flex: 1, minWidth: '22%', backgroundColor: cardBg, borderRadius: 24, padding: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'space-between', aspectRatio: 1 }}>
                                                <Text style={{ fontSize: 13, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>{t('uv_index', lang)}</Text>
                                                <View style={{ height: 42, width: 70, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Svg viewBox="0 0 100 55" width="100%" height="100%">
                                                        <Defs>
                                                            <SvgLinearGradient id="uvArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                <Stop offset="0%" stopColor="#22c55e" />
                                                                <Stop offset="30%" stopColor="#eab308" />
                                                                <Stop offset="60%" stopColor="#f97316" />
                                                                <Stop offset="85%" stopColor="#ef4444" />
                                                                <Stop offset="100%" stopColor="#a855f7" />
                                                            </SvgLinearGradient>
                                                        </Defs>
                                                        <Path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#uvArcGradient)" strokeWidth="8" strokeLinecap="round" />
                                                        <Circle
                                                            cx={50 + 40 * Math.cos(((180 + (Math.min(current.uv_index || 0, 11) / 11) * 180) * Math.PI) / 180)}
                                                            cy={50 + 40 * Math.sin(((180 + (Math.min(current.uv_index || 0, 11) / 11) * 180) * Math.PI) / 180)}
                                                            r="6" fill="white" stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="2"
                                                        />
                                                    </Svg>
                                                </View>
                                                <Text style={{ fontSize: 28, fontWeight: '600', color: textColor }}>{current.uv_index !== undefined ? Math.round(current.uv_index) : '--'}</Text>
                                            </View>

                                            <View style={{ flex: 1, minWidth: '22%', backgroundColor: cardBg, borderRadius: 24, padding: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'space-between', aspectRatio: 1 }}>
                                                <Text style={{ fontSize: 13, color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>{t('rain', lang)}</Text>
                                                <View style={{ height: 42, width: 56, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Svg viewBox="0 0 100 75" width="100%" height="100%">
                                                        <Path
                                                            d="M25 45 C10 45, 10 30, 25 28 C25 15, 45 10, 55 20 C75 15, 90 25, 85 40 C95 45, 90 55, 75 55 L25 55 C10 55, 10 45, 25 45 Z"
                                                            fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)'}
                                                        />
                                                        {((weather?.daily_forecast?.[0]?.precipitation_probability || 0) > 20) && (
                                                            <>
                                                                <Circle cx="35" cy="65" r="3" fill={isDark ? '#60a5fa' : '#3b82f6'} opacity="0.8" />
                                                                <Circle cx="50" cy="65" r="3" fill={isDark ? '#60a5fa' : '#3b82f6'} opacity="0.8" />
                                                                <Circle cx="65" cy="65" r="3" fill={isDark ? '#60a5fa' : '#3b82f6'} opacity="0.8" />
                                                            </>
                                                        )}
                                                    </Svg>
                                                </View>
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 28, fontWeight: '600', color: textColor }}>{weather?.daily_forecast?.[0]?.precipitation_probability || 0}%</Text>
                                                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>{weather?.daily_forecast?.[0]?.precipitation_sum || 0} mm</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {/* Temperature Chart */}
                                    {weather?.hourly_forecast && weather.hourly_forecast.length > 0 && (
                                        <TemperatureChart
                                            data={weather.hourly_forecast}
                                            textColor={textColor}
                                            cardBg={cardBg}
                                        />
                                    )}

                                    {/* AI Summary - Phone only */}
                                    {!isTablet && weather?.ai_summary && (
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
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* Phone Layout: Current Weather */}
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

                                <View style={{ gap: 16 }}>

                                    {/* Hourly Forecast */}
                                    {weather?.hourly_forecast && weather.hourly_forecast.length > 0 && (
                                        <AnimatedCard index={0}>
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
                                        </AnimatedCard>
                                    )}

                                    {/* Temperature Chart */}
                                    {weather?.hourly_forecast && weather.hourly_forecast.length > 0 && (
                                        <AnimatedCard index={1}>
                                            <TemperatureChart
                                                data={weather.hourly_forecast}
                                                textColor={textColor}
                                                cardBg={cardBg}
                                            />
                                        </AnimatedCard>
                                    )}

                                    {/* Weather Details */}
                                    {current && (
                                        <AnimatedCard index={2}>
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
                                                language={lang}
                                                timeFormat={settings.time_format}
                                            />
                                        </AnimatedCard>
                                    )}

                                    {/* Moon Phase Card — All tiers */}
                                    {weather?.astronomy && (
                                        <AnimatedCard index={3}>
                                            <MoonPhaseCard
                                                astronomy={weather.astronomy}
                                                textColor={textColor}
                                                subTextColor={subTextColor}
                                                cardBg={cardBg}
                                                isDark={isDark}
                                                language={lang}
                                                timeFormat={settings.time_format}
                                            />
                                        </AnimatedCard>
                                    )}

                                    {/* AI Summary — Pro/Ultra only */}
                                    {weather?.ai_summary && tier !== 'free' && (
                                        <AnimatedCard index={4}>
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
                                        </AnimatedCard>
                                    )}

                                    {/* Model Divergence Alert */}
                                    {weather?.model_agreement?.alert && (
                                        <AnimatedCard index={5}>
                                            <View style={[styles.divergenceAlert, { backgroundColor: isDark ? 'rgba(255,165,0,0.15)' : 'rgba(255,140,0,0.1)' }]}>
                                                <Text style={[styles.divergenceText, { color: isDark ? '#FFB347' : '#CC7000' }]}>
                                                    {weather.model_agreement.alert}
                                                </Text>
                                            </View>
                                        </AnimatedCard>
                                    )}

                                    {/* Daily Forecast */}
                                    {weather?.daily_forecast && weather.daily_forecast.length > 0 && (
                                        <AnimatedCard index={6}>
                                            <DailyForecast
                                                data={weather.daily_forecast}
                                                textColor={textColor}
                                                subTextColor={subTextColor}
                                                cardBg={cardBg}
                                                isDark={isDark}
                                                onDayPress={(day) => setSelectedDay(day)}
                                                language={lang}
                                            />
                                        </AnimatedCard>
                                    )}

                                    {/* Aurora Card */}
                                    {shouldShowAurora(
                                        settings.aurora_display,
                                        auroraData?.visibility_probability
                                    ) && (
                                            <AnimatedCard index={7}>
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
                                            </AnimatedCard>
                                        )}

                                    {/* AstroPack Card (Ultra) */}
                                    {tier === 'ultra' && astroData && (
                                        <AnimatedCard index={8}>
                                            <AstroCard
                                                data={astroData}
                                                textColor={textColor}
                                                subTextColor={subTextColor}
                                                cardBg={cardBg}
                                                isDark={isDark}
                                                language={lang}
                                            />
                                        </AnimatedCard>
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
                                </View>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>

            {/* Search Modal */}
            < Modal
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
            </Modal >

            {/* Day Detail Modal */}
            < DayDetailModal
                visible={!!selectedDay
                }
                onClose={() => setSelectedDay(null)}
                day={selectedDay}
                themeGradient={theme.gradient}
                isDark={theme.is_dark}
                language={settings.language}
                timeFormat={settings.time_format}
                temperatureUnit={settings.temperature_unit}
            />

            {/* Settings Modal */}
            < Modal
                visible={showSettings}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <SettingsScreen
                    onClose={() => setShowSettings(false)}
                    themeGradient={theme.gradient}
                    isDark={theme.is_dark}
                />
            </Modal >

            {/* AI Explanation Modal */}
            < ExplainModal
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
    divergenceAlert: {
        padding: 12,
        borderRadius: 12,
        marginTop: 2,
    },
    divergenceText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export default HomeScreen;
