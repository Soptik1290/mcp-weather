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
import { X } from 'lucide-react-native';

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

    const details = [
        { label: 'Max teplota', value: `${Math.round(day.temperature_max)}°C`, icon: '🌡️' },
        { label: 'Min teplota', value: `${Math.round(day.temperature_min)}°C`, icon: '❄️' },
        day.precipitation_probability !== undefined && {
            label: 'Šance srážek',
            value: `${day.precipitation_probability}%`,
            icon: '💧'
        },
        day.precipitation_sum !== undefined && day.precipitation_sum > 0 && {
            label: 'Srážky',
            value: `${day.precipitation_sum} mm`,
            icon: '🌧️'
        },
        day.wind_speed_max !== undefined && {
            label: 'Max vítr',
            value: `${Math.round(day.wind_speed_max)} km/h`,
            icon: '💨'
        },
        day.uv_index_max !== undefined && {
            label: 'UV Index',
            value: `${day.uv_index_max}`,
            icon: '☀️'
        },
        day.sunrise && {
            label: 'Východ slunce',
            value: formatTime(day.sunrise),
            icon: '🌅'
        },
        day.sunset && {
            label: 'Západ slunce',
            value: formatTime(day.sunset),
            icon: '🌇'
        },
    ].filter(Boolean) as { label: string; value: string; icon: string }[];

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

                        {/* Details Grid */}
                        <View style={[styles.detailsCard, { backgroundColor: cardBg }]}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                Podrobnosti
                            </Text>
                            <View style={styles.detailsGrid}>
                                {details.map((detail, index) => (
                                    <View key={index} style={styles.detailItem}>
                                        <Text style={styles.detailIcon}>{detail.icon}</Text>
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
        marginBottom: 30,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    date: {
        fontSize: 24,
        fontWeight: '600',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    description: {
        fontSize: 18,
        marginBottom: 16,
    },
    tempRange: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    tempMax: {
        fontSize: 48,
        fontWeight: '300',
    },
    tempSeparator: {
        fontSize: 32,
        marginHorizontal: 8,
    },
    tempMin: {
        fontSize: 32,
        fontWeight: '300',
    },
    detailsCard: {
        borderRadius: 20,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailItem: {
        width: (width - 80) / 3,
        alignItems: 'center',
        paddingVertical: 16,
    },
    detailIcon: {
        fontSize: 28,
        marginBottom: 8,
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
