import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
} from 'react-native';
import { Droplets } from 'lucide-react-native';
import { getWeatherIcon, getWeatherIconColor, t, formatTimeString } from '../utils';
import type { TimeFormat } from '../types';

interface HourlyData {
    time: string;
    temperature: number;
    weather_code?: number;
    precipitation_probability?: number;
}

interface HourlyForecastProps {
    data: HourlyData[];
    textColor: string;
    subTextColor: string;
    cardBg: string;
    isDark?: boolean;
    formatTemperature: (temp: number) => string;
    language?: 'en' | 'cs';
    timeFormat?: TimeFormat;
}

const formatHour = (timeString: string, lang: 'en' | 'cs' = 'cs', timeFmt: TimeFormat = '24h'): string => {
    try {
        const date = new Date(timeString);
        if (timeFmt === '12h') {
            const h = date.getHours();
            const period = h >= 12 ? 'PM' : 'AM';
            const hour = h % 12 || 12;
            return `${hour}${period}`;
        }
        return date.toLocaleTimeString('cs', {
            hour: '2-digit',
            minute: undefined,
            hour12: false
        }).replace(':00', '');
    } catch {
        return timeString;
    }
};

const isCurrentHour = (timeString: string): boolean => {
    try {
        const date = new Date(timeString);
        const now = new Date();
        return date.getDate() === now.getDate() &&
            date.getHours() === now.getHours();
    } catch {
        return false;
    }
};

const isNightTime = (timeString: string): boolean => {
    try {
        const date = new Date(timeString);
        const hour = date.getHours();
        return hour < 6 || hour >= 20;
    } catch {
        return false;
    }
};

export function HourlyForecast({
    data,
    textColor,
    subTextColor,
    cardBg,
    isDark = false,
    formatTemperature,
    language = 'cs',
    timeFormat = '24h',
}: HourlyForecastProps) {
    if (!data || data.length === 0) return null;

    // Find index of current hour
    const nowIndex = React.useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentHourStr = `${currentYear}-${currentMonth}-${currentDay}T${currentHour}`;

        // Find exact match or closest match
        let idx = data.findIndex(h => h.time.startsWith(currentHourStr));

        // Fallback: finding closest time
        if (idx === -1) {
            let minDiff = Infinity;
            data.forEach((h, i) => {
                const diff = Math.abs(new Date(h.time).getTime() - now.getTime());
                if (diff < minDiff) {
                    minDiff = diff;
                    idx = i;
                }
            });
        }
        return Math.max(0, idx);
    }, [data]);

    const renderItem = ({ item, index }: { item: HourlyData, index: number }) => {
        const isNight = isNightTime(item.time);
        const WeatherIcon = getWeatherIcon(item.weather_code, isNight);
        const iconColor = getWeatherIconColor(item.weather_code, isDark);
        const isCurrent = index === nowIndex;

        return (
            <View
                style={[
                    styles.hourItem,
                    isCurrent && styles.currentItem,
                    isCurrent && { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }
                ]}
            >
                <Text style={[
                    styles.hourTime,
                    { color: isCurrent ? textColor : subTextColor },
                    isCurrent && { fontWeight: '700' }
                ]}>
                    {isCurrent ? t('now', language) : formatHour(item.time, language, timeFormat)}
                </Text>
                <View style={styles.iconContainer}>
                    <WeatherIcon size={28} color={iconColor} strokeWidth={1.5} />
                </View>
                <Text style={[
                    styles.hourTemp,
                    { color: textColor },
                    isCurrent && { fontSize: 17 }
                ]}>
                    {formatTemperature(item.temperature)}
                </Text>
                {item.precipitation_probability !== undefined && item.precipitation_probability > 0 && (
                    <View style={styles.rainRow}>
                        <Droplets size={10} color="#4A90D9" strokeWidth={2} />
                        <Text style={[styles.hourRain, { color: textColor }]}>
                            {item.precipitation_probability}%
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                {t('hourly_forecast', language)}
            </Text>
            <FlatList
                horizontal
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.time}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                getItemLayout={(data: HourlyData[] | null | undefined, index: number) => ({
                    length: 64, // approximate width + gap 
                    offset: 64 * index,
                    index,
                })}
                initialScrollIndex={Math.max(0, nowIndex - 1)} // Start slightly before current so user sees context
                onScrollToIndexFailed={(info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
                    // Fallback if measurement isn't ready
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 16,
    },
    scrollContent: {
        gap: 0, // Handled by padding in items or manual spacing if needed
    },
    hourItem: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 12,
        minWidth: 64,
        borderRadius: 16,
        marginHorizontal: 2,
    },
    currentItem: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    hourTime: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    iconContainer: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    hourTemp: {
        fontSize: 15,
        fontWeight: '600',
    },
    rainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    hourRain: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default HourlyForecast;
