import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';

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
    formatTemperature: (temp: number) => string;
}

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

export function HourlyForecast({
    data,
    textColor,
    subTextColor,
    cardBg,
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
                {hourlyData.map((hour, index) => (
                    <View key={`${hour.time}-${index}`} style={styles.hourItem}>
                        <Text style={[styles.hourTime, { color: subTextColor }]}>
                            {formatHour(hour.time)}
                        </Text>
                        <Text style={styles.hourEmoji}>
                            {getWeatherEmoji(hour.weather_code)}
                        </Text>
                        <Text style={[styles.hourTemp, { color: textColor }]}>
                            {formatTemperature(hour.temperature)}
                        </Text>
                        {hour.precipitation_probability !== undefined && hour.precipitation_probability > 0 && (
                            <Text style={[styles.hourRain, { color: '#4A90D9' }]}>
                                💧{hour.precipitation_probability}%
                            </Text>
                        )}
                    </View>
                ))}
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
    hourEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    hourTemp: {
        fontSize: 15,
        fontWeight: '600',
    },
    hourRain: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500',
    },
});

export default HourlyForecast;
