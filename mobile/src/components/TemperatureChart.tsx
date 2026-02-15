import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
    Path,
    Defs,
    LinearGradient,
    Stop,
    Circle,
    Text as SvgText,
    G
} from 'react-native-svg';

interface HourlyData {
    time: string;
    temperature: number;
    weather_code?: number;
    precipitation_probability?: number;
    wind_speed?: number;
    humidity?: number;
}

interface TemperatureChartProps {
    data: HourlyData[];
    textColor: string;
    cardBg: string;
    height?: number;
}

const formatHour = (timeString: string, index: number): string => {
    if (index === 0) return 'Teď';
    try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('cs', {
            hour: '2-digit',
            hour12: false
        }).replace(':00', 'h');
    } catch {
        return '';
    }
};

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

export function TemperatureChart({
    data,
    textColor,
    cardBg,
    height = 160
}: TemperatureChartProps) {
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    if (!data || data.length < 2) return null;

    // Take 12 hours for the chart
    const chartData = data.slice(0, 12);
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 72;
    const chartHeight = height;
    const paddingTop = 30;
    const paddingBottom = 45;
    const paddingHorizontal = 15;

    // Find min/max temps
    const temps = chartData.map(d => d.temperature);
    const minTemp = Math.min(...temps) - 1;
    const maxTemp = Math.max(...temps) + 1;
    const tempRange = maxTemp - minTemp || 1;

    // Calculate points
    const graphHeight = chartHeight - paddingTop - paddingBottom;
    const stepX = (chartWidth - paddingHorizontal * 2) / (chartData.length - 1);

    const points = chartData.map((item, index) => {
        const x = paddingHorizontal + index * stepX;
        const y = paddingTop + graphHeight - ((item.temperature - minTemp) / tempRange) * graphHeight;
        return { x, y, ...item };
    });

    // Create paths (omitted for brevity, same as before)
    const createSmoothPath = () => {
        if (points.length < 2) return '';
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const tension = 0.3;
            const cp1x = current.x + (next.x - current.x) * tension;
            const cp1y = current.y;
            const cp2x = next.x - (next.x - current.x) * tension;
            const cp2y = next.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }
        return path;
    };

    const fillPath = `${createSmoothPath()} L ${points[points.length - 1].x} ${chartHeight - paddingBottom + 10} L ${points[0].x} ${chartHeight - paddingBottom + 10} Z`;
    const linePath = createSmoothPath();

    const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                {selectedIndex !== null ? 'Detail' : 'Temperature Trend'}
            </Text>

            <View>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        <LinearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor="#4A90D9" stopOpacity="0.4" />
                            <Stop offset="100%" stopColor="#4A90D9" stopOpacity="0" />
                        </LinearGradient>
                        <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#4A90D9" />
                            <Stop offset="50%" stopColor="#67B8DE" />
                            <Stop offset="100%" stopColor="#4A90D9" />
                        </LinearGradient>
                    </Defs>

                    <Path d={fillPath} fill="url(#gradientFill)" />
                    <Path d={linePath} stroke="url(#lineGradient)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Interactive Areas */}
                    {points.map((point, index) => (
                        <G key={index} onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}>
                            {/* Invisible touch target */}
                            <Circle cx={point.x} cy={point.y} r={20} fill="transparent" />

                            {/* Visible Dot */}
                            <Circle
                                cx={point.x}
                                cy={point.y}
                                r={selectedIndex === index ? 6 : 4}
                                fill={selectedIndex === index ? "#ffeb3b" : "#fff"}
                                stroke="#4A90D9"
                                strokeWidth={2}
                            />

                            {/* Labels (hide if selected to avoid clutter) */}
                            {selectedIndex !== index && (
                                <SvgText
                                    x={point.x}
                                    y={point.y - 12}
                                    fontSize={12}
                                    fontWeight="600"
                                    fill={textColor}
                                    textAnchor="middle"
                                >
                                    {Math.round(point.temperature)}°
                                </SvgText>
                            )}

                            {index % 2 === 0 && (
                                <SvgText
                                    x={point.x}
                                    y={chartHeight - paddingBottom + 40}
                                    fontSize={11}
                                    fill={textColor}
                                    textAnchor="middle"
                                    opacity={0.7}
                                >
                                    {formatHour(point.time, index)}
                                </SvgText>
                            )}
                        </G>
                    ))}
                </Svg>

                {/* Tooltip Overlay */}
                {selectedPoint && (
                    <View style={[
                        styles.tooltip,
                        {
                            left: Math.min(Math.max(selectedPoint.x - 60, 0), chartWidth - 120),
                            top: selectedPoint.y - 70,
                            backgroundColor: textColor === '#fff' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                        }
                    ]}>
                        <Text style={[styles.tooltipText, { color: textColor === '#fff' ? '#fff' : '#000', fontWeight: 'bold' }]}>
                            {formatHour(selectedPoint.time, 1)} • {Math.round(selectedPoint.temperature)}°C
                        </Text>
                        <View style={styles.tooltipRow}>
                            {selectedPoint.precipitation_probability !== undefined && (
                                <Text style={styles.tooltipSub}>💧 {selectedPoint.precipitation_probability}%</Text>
                            )}
                            {selectedPoint.wind_speed !== undefined && (
                                <Text style={styles.tooltipSub}>💨 {Math.round(selectedPoint.wind_speed)}km/h</Text>
                            )}
                            {selectedPoint.humidity !== undefined && (
                                <Text style={styles.tooltipSub}>💧 {selectedPoint.humidity}%</Text>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        paddingBottom: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
    },
    tooltip: {
        position: 'absolute',
        padding: 8,
        borderRadius: 8,
        minWidth: 100,
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    tooltipText: {
        fontSize: 13,
        marginBottom: 4,
        textAlign: 'center',
    },
    tooltipRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    tooltipSub: {
        fontSize: 11,
        color: '#94a3b8',
    },
});

export default TemperatureChart;
