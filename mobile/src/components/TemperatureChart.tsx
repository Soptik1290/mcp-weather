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
    height = 180
}: TemperatureChartProps) {
    if (!data || data.length < 2) return null;

    // Take 12 hours for the chart (easier to read)
    const chartData = data.slice(0, 12);
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 40; // padding
    const chartHeight = height;
    const paddingTop = 35;
    const paddingBottom = 50;
    const paddingHorizontal = 10;

    // Find min/max temps
    const temps = chartData.map(d => d.temperature);
    const minTemp = Math.min(...temps) - 1;
    const maxTemp = Math.max(...temps) + 1;
    const tempRange = maxTemp - minTemp || 1;

    // Calculate points
    const graphHeight = chartHeight - paddingTop - paddingBottom;
    const graphWidth = chartWidth - paddingHorizontal * 2;
    const stepX = graphWidth / (chartData.length - 1);

    const points = chartData.map((item, index) => {
        const x = paddingHorizontal + index * stepX;
        const y = paddingTop + graphHeight - ((item.temperature - minTemp) / tempRange) * graphHeight;
        return { x, y, temp: item.temperature, time: item.time, code: item.weather_code };
    });

    // Create smooth curve path using cubic bezier
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

    // Create gradient fill path
    const createFillPath = () => {
        const linePath = createSmoothPath();
        const lastPoint = points[points.length - 1];
        const firstPoint = points[0];
        return `${linePath} L ${lastPoint.x} ${chartHeight - paddingBottom + 10} L ${firstPoint.x} ${chartHeight - paddingBottom + 10} Z`;
    };

    const linePath = createSmoothPath();
    const fillPath = createFillPath();

    return (
        <View style={[styles.container, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
                Graf teploty
            </Text>

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

                {/* Gradient fill under line */}
                <Path
                    d={fillPath}
                    fill="url(#gradientFill)"
                />

                {/* Line */}
                <Path
                    d={linePath}
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Points and labels */}
                {points.map((point, index) => (
                    <G key={index}>
                        {/* Temperature label above point */}
                        <SvgText
                            x={point.x}
                            y={point.y - 12}
                            fontSize={12}
                            fontWeight="600"
                            fill={textColor}
                            textAnchor="middle"
                        >
                            {Math.round(point.temp)}°
                        </SvgText>

                        {/* Point dot */}
                        <Circle
                            cx={point.x}
                            cy={point.y}
                            r={4}
                            fill="#fff"
                            stroke="#4A90D9"
                            strokeWidth={2}
                        />

                        {/* Weather emoji */}
                        {index % 2 === 0 && (
                            <SvgText
                                x={point.x}
                                y={chartHeight - paddingBottom + 20}
                                fontSize={16}
                                textAnchor="middle"
                            >
                                {getWeatherEmoji(point.code)}
                            </SvgText>
                        )}

                        {/* Time label */}
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
});

export default TemperatureChart;
