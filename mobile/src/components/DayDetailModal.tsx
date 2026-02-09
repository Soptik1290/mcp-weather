import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import {
    X,
    Thermometer,
    ThermometerSnowflake,
    Droplets,
    CloudRain,
    Wind,
    Sun,
    Sunrise,
    Sunset,
} from 'lucide-react-native';

interface DayDetailModalProps {
    visible: boolean;
    onClose: () => void;
    day: {
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
    } | null;
    themeGradient: string[];
    isDark: boolean;
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

const getWeatherDescription = (code?: number): string => {
    if (!code) return 'Neznámé';
    if (code === 0) return 'Jasno';
    if (code <= 3) return 'Částečně oblačno';
    if (code <= 48) return 'Mlha';
    if (code <= 55) return 'Mrholení';
    if (code <= 67) return 'Déšť';
    if (code <= 77) return 'Sněžení';
    if (code <= 82) return 'Přeháňky';
    if (code <= 86) return 'Sněhové přeháňky';
    if (code >= 95) return 'Bouřka';
    return 'Proměnlivé';
};

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('cs', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    } catch {
        return dateString;
    }
};

const formatTime = (timeString?: string): string => {
    if (!timeString) return '--:--';
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('cs', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return timeString;
    }
};

// Temperature Range Chart Component
function TemperatureRangeChart({
    min,
    max,
    textColor,
    cardBg
}: {
    min: number;
    max: number;
    textColor: string;
    cardBg: string;
}) {
    const width = Dimensions.get('window').width - 80;
    const height = 80;
    const padding = 20;

    // Scale temps to chart
    const range = max - min || 1;
    const minX = padding;
    const maxX = width - padding;

    return (
        <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
                Teplotní rozsah
            </Text>
            <Svg width={width} height={height}>
                <Defs>
                    <SvgGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#67B8DE" />
                        <Stop offset="100%" stopColor="#FF6B6B" />
                    </SvgGradient>
                </Defs>

                {/* Background track */}
                <Path
                    d={`M ${minX} ${height / 2} L ${maxX} ${height / 2}`}
                    stroke="rgba(128,128,128,0.2)"
                    strokeWidth={8}
                    strokeLinecap="round"
                />

                {/* Colored range bar */}
                <Path
                    d={`M ${minX} ${height / 2} L ${maxX} ${height / 2}`}
                    stroke="url(#tempGrad)"
                    strokeWidth={8}
                    strokeLinecap="round"
                />

                {/* Min point */}
                <Circle cx={minX} cy={height / 2} r={12} fill="#67B8DE" />
                <SvgText
                    x={minX}
                    y={height / 2 + 4}
                    fontSize={11}
                    fontWeight="bold"
                    fill="#fff"
                    textAnchor="middle"
                >
                    {Math.round(min)}°
                </SvgText>

                {/* Max point */}
                <Circle cx={maxX} cy={height / 2} r={12} fill="#FF6B6B" />
                <SvgText
                    x={maxX}
                    y={height / 2 + 4}
                    fontSize={11}
                    fontWeight="bold"
                    fill="#fff"
                    textAnchor="middle"
                >
                    {Math.round(max)}°
                </SvgText>

                {/* Labels */}
                <SvgText
                    x={minX}
                    y={height - 5}
                    fontSize={12}
                    fill={textColor}
                    textAnchor="middle"
                    opacity={0.7}
                >
                    Min
                </SvgText>
                <SvgText
                    x={maxX}
                    y={height - 5}
                    fontSize={12}
                    fill={textColor}
                    textAnchor="middle"
                    opacity={0.7}
                >
                    Max
                </SvgText>
            </Svg>
        </View>
    );
}

type DetailItem = {
    label: string;
    value: string;
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
    color: string;
};

export function DayDetailModal({
    visible,
    onClose,
    day,
    themeGradient,
    isDark,
}: DayDetailModalProps) {
    if (!day) return null;

    const textColor = isDark ? '#fff' : '#1a1a1a';
    const subTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const cardBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';

    const details: DetailItem[] = [
        {
            label: 'Max teplota',
            value: `${Math.round(day.temperature_max)}°C`,
            Icon: Thermometer,
            color: '#FF6B6B'
        },
        {
            label: 'Min teplota',
            value: `${Math.round(day.temperature_min)}°C`,
            Icon: ThermometerSnowflake,
            color: '#67B8DE'
        },
        ...(day.precipitation_probability !== undefined ? [{
            label: 'Šance srážek',
            value: `${day.precipitation_probability}%`,
            Icon: Droplets,
            color: '#4A90D9'
        }] : []),
        ...(day.precipitation_sum !== undefined && day.precipitation_sum > 0 ? [{
            label: 'Srážky',
            value: `${day.precipitation_sum} mm`,
            Icon: CloudRain,
            color: '#5DA5E8'
        }] : []),
        ...(day.wind_speed_max !== undefined ? [{
            label: 'Max vítr',
            value: `${Math.round(day.wind_speed_max)} km/h`,
            Icon: Wind,
            color: '#9CA3AF'
        }] : []),
        ...(day.uv_index_max !== undefined ? [{
            label: 'UV Index',
            value: `${day.uv_index_max}`,
            Icon: Sun,
            color: '#FBBF24'
        }] : []),
        ...(day.sunrise ? [{
            label: 'Východ slunce',
            value: formatTime(day.sunrise),
            Icon: Sunrise,
            color: '#FB923C'
        }] : []),
        ...(day.sunset ? [{
            label: 'Západ slunce',
            value: formatTime(day.sunset),
            Icon: Sunset,
            color: '#F472B6'
        }] : []),
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={themeGradient}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft} />
                        <Text style={[styles.headerTitle, { color: textColor }]}>
                            Detail dne
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: cardBg }]}
                        >
                            <X size={22} color={textColor} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Main Info */}
                        <View style={styles.mainInfo}>
                            <Text style={styles.emoji}>
                                {getWeatherEmoji(day.weather_code)}
                            </Text>
                            <Text style={[styles.date, { color: textColor }]}>
                                {formatDate(day.date)}
                            </Text>
                            <Text style={[styles.description, { color: subTextColor }]}>
                                {getWeatherDescription(day.weather_code)}
                            </Text>
                            <View style={styles.tempRange}>
                                <Text style={[styles.tempMax, { color: textColor }]}>
                                    {Math.round(day.temperature_max)}°
                                </Text>
                                <Text style={[styles.tempSeparator, { color: subTextColor }]}>
                                    /
                                </Text>
                                <Text style={[styles.tempMin, { color: subTextColor }]}>
                                    {Math.round(day.temperature_min)}°
                                </Text>
                            </View>
                        </View>

                        {/* Temperature Range Chart */}
                        <TemperatureRangeChart
                            min={day.temperature_min}
                            max={day.temperature_max}
                            textColor={textColor}
                            cardBg={cardBg}
                        />

                        {/* Details Grid - 2 columns */}
                        <View style={[styles.detailsCard, { backgroundColor: cardBg }]}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                Podrobnosti
                            </Text>
                            <View style={styles.detailsGrid}>
                                {details.map((detail, index) => (
                                    <View key={index} style={styles.detailItem}>
                                        <View style={[styles.iconContainer, { backgroundColor: `${detail.color}20` }]}>
                                            <detail.Icon size={24} color={detail.color} strokeWidth={2} />
                                        </View>
                                        <Text style={[styles.detailValue, { color: textColor }]}>
                                            {detail.value}
                                        </Text>
                                        <Text style={[styles.detailLabel, { color: subTextColor }]}>
                                            {detail.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </Modal>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        width: 44,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 10,
        borderRadius: 12,
    },
    content: {
        padding: 20,
    },
    mainInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 72,
        marginBottom: 12,
    },
    date: {
        fontSize: 22,
        fontWeight: '600',
        textTransform: 'capitalize',
        marginBottom: 6,
    },
    description: {
        fontSize: 16,
        marginBottom: 12,
    },
    tempRange: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tempMax: {
        fontSize: 44,
        fontWeight: '300',
    },
    tempSeparator: {
        fontSize: 28,
        marginHorizontal: 6,
    },
    tempMin: {
        fontSize: 28,
        fontWeight: '300',
    },
    chartCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    detailsCard: {
        borderRadius: 20,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailItem: {
        width: (width - 72) / 2,
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
});

export default DayDetailModal;
