import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Droplets } from 'lucide-react-native';
import { getWeatherIcon, getWeatherIconColor } from '../utils';

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
}

const formatHour = (timeString: string): string => {
    try {
        const date = new Date(timeString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday && Math.abs(date.getTime() - now.getTime()) < 3600000) {
            return 'Teď';
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
    formatTemperature
}: HourlyForecastProps) {
    if (!data || data.length === 0) return null;

    // Get next 24 hours
    const hourlyData = data.slice(0, 24);

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                Hodinová předpověď
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {hourlyData.map((hour, index) => {
                    const isNight = isNightTime(hour.time);
                    const WeatherIcon = getWeatherIcon(hour.weather_code, isNight);
                    const iconColor = getWeatherIconColor(hour.weather_code, isDark);

                    return (
                        <View key={`${hour.time}-${index}`} style={styles.hourItem}>
                            <Text style={[styles.hourTime, { color: subTextColor }]}>
                                {formatHour(hour.time)}
                            </Text>
                            <View style={styles.iconContainer}>
                                <WeatherIcon size={28} color={iconColor} strokeWidth={1.5} />
                            </View>
                            <Text style={[styles.hourTemp, { color: textColor }]}>
                                {formatTemperature(hour.temperature)}
                            </Text>
                            {hour.precipitation_probability !== undefined && hour.precipitation_probability > 0 && (
                                <View style={styles.rainRow}>
                                    <Droplets size={10} color="#4A90D9" strokeWidth={2} />
                                    <Text style={[styles.hourRain, { color: '#4A90D9' }]}>
                                        {hour.precipitation_probability}%
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
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
        gap: 4,
    },
    hourItem: {
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        minWidth: 60,
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
