import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface DailyData {
    date: string;
    temperature_max: number;
    temperature_min: number;
    weather_code?: number;
    precipitation_probability?: number;
    precipitation_sum?: number;
    wind_speed_max?: number;
    sunrise?: string;
    sunset?: string;
    uv_index_max?: number;
}

interface DailyForecastProps {
    data: DailyData[];
    textColor: string;
    subTextColor: string;
    cardBg: string;
    onDayPress?: (day: DailyData) => void;
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

const formatDay = (dateString: string, index: number): string => {
    if (index === 0) return 'Dnes';
    if (index === 1) return 'Zítra';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('cs', { weekday: 'short' });
    } catch {
        return dateString;
    }
};

export function DailyForecast({
    data,
    textColor,
    subTextColor,
    cardBg,
    onDayPress
}: DailyForecastProps) {
    if (!data || data.length === 0) return null;

    // Show 7 days
    const dailyData = data.slice(0, 7);

    // Find min/max temperatures for the bar visualization
    const allTemps = dailyData.flatMap(d => [d.temperature_max, d.temperature_min]);
    const globalMin = Math.min(...allTemps);
    const globalMax = Math.max(...allTemps);
    const tempRange = globalMax - globalMin || 1;

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                Týdenní předpověď
            </Text>
            {dailyData.map((day, index) => {
                // Calculate bar positions
                const minPos = ((day.temperature_min - globalMin) / tempRange) * 100;
                const maxPos = ((day.temperature_max - globalMin) / tempRange) * 100;
                const barWidth = maxPos - minPos;

                const RowComponent = onDayPress ? TouchableOpacity : View;

                return (
                    <RowComponent
                        key={day.date}
                        style={[
                            styles.dayRow,
                            index < dailyData.length - 1 && styles.dayRowBorder
                        ]}
                        onPress={onDayPress ? () => onDayPress(day) : undefined}
                        activeOpacity={0.7}
                    >
                        {/* Day name */}
                        <Text style={[styles.dayName, { color: textColor }]}>
                            {formatDay(day.date, index)}
                        </Text>

                        {/* Weather icon */}
                        <Text style={styles.dayEmoji}>
                            {getWeatherEmoji(day.weather_code)}
                        </Text>

                        {/* Rain probability */}
                        <View style={styles.rainContainer}>
                            {day.precipitation_probability !== undefined && day.precipitation_probability > 0 && (
                                <Text style={[styles.rainText, { color: '#4A90D9' }]}>
                                    💧{day.precipitation_probability}%
                                </Text>
                            )}
                        </View>

                        {/* Temperature bar */}
                        <View style={styles.tempBarContainer}>
                            <Text style={[styles.tempMin, { color: subTextColor }]}>
                                {Math.round(day.temperature_min)}°
                            </Text>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.tempBar,
                                        {
                                            left: `${minPos}%`,
                                            width: `${Math.max(barWidth, 10)}%`,
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.tempMax, { color: textColor }]}>
                                {Math.round(day.temperature_max)}°
                            </Text>
                        </View>

                        {/* Chevron indicator */}
                        {onDayPress && (
                            <ChevronRight
                                size={18}
                                color={subTextColor}
                                style={styles.chevron}
                            />
                        )}
                    </RowComponent>
                );
            })}
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
        marginBottom: 12,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    dayRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    dayName: {
        width: 50,
        fontSize: 15,
        fontWeight: '500',
    },
    dayEmoji: {
        fontSize: 24,
        width: 36,
        textAlign: 'center',
    },
    rainContainer: {
        width: 48,
        alignItems: 'center',
    },
    rainText: {
        fontSize: 11,
        fontWeight: '500',
    },
    tempBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tempMin: {
        fontSize: 14,
        fontWeight: '500',
        width: 28,
        textAlign: 'right',
    },
    barWrapper: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(128,128,128,0.15)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    tempBar: {
        position: 'absolute',
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#4A90D9',
    },
    tempMax: {
        fontSize: 14,
        fontWeight: '600',
        width: 28,
    },
    chevron: {
        marginLeft: 4,
    },
});

export default DailyForecast;
