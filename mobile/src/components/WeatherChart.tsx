import React from 'react';
import { View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import Svg, {
    Path,
    Defs,
    LinearGradient,
    Stop,
    Circle,
    Rect,
    Text as SvgText,
    G
} from 'react-native-svg';
import { t, formatTime, TimeFormat } from '../utils';
import { useSettingsStore } from '../stores';

interface HourlyData {
    time: string;
    temperature: number;
    weather_code?: number;
    precipitation_probability?: number;
    wind_speed?: number;
    humidity?: number;
    pressure?: number;
    precipitation_amount?: number;
}

export interface ChartConfig {
    titleKey: string;
    valueExtractor: (d: HourlyData) => number | undefined;
    formatValue: (v: number) => string;
    lineColor: string;
    gradientId: string;
    fixedYRange?: { min: number; max: number };
    minYRange?: number;
    tooltipExtra?: (d: HourlyData) => string | null;
    labelInterval?: number;
    summaryFn?: (data: HourlyData[]) => string | null;
    barExtractor?: (d: HourlyData) => number | undefined;
    barColor?: string;
    barMaxValue?: number;
}

interface WeatherChartProps {
    data: HourlyData[];
    config: ChartConfig;
    textColor: string;
    cardBg: string;
    height?: number;
}

const formatHour = (timeString: string, index: number, language: string, timeFormat: TimeFormat): string => {
    if (index === 0) return t('now', language as any);
    try {
        const date = new Date(timeString);
        let timeStr = formatTime(date, timeFormat);
        if (timeFormat === '24h') {
            timeStr = timeStr.replace(':00', 'h');
        } else {
            timeStr = timeStr.replace(':00', '');
        }
        return timeStr;
    } catch {
        return '';
    }
};

export function WeatherChart({
    data,
    config,
    textColor,
    cardBg,
    height = 160
}: WeatherChartProps) {
    const settings = useSettingsStore(state => state.settings);
    const language = settings.language;
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [chartWidth, setChartWidth] = React.useState(Dimensions.get('window').width - 72);

    if (!data || data.length < 2) return null;

    // Find index of current hour
    const nowIndex = React.useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentHourStr = `${currentYear}-${currentMonth}-${currentDay}T${currentHour}`;

        let idx = data.findIndex(h => h.time.startsWith(currentHourStr));
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

    // Take 12 hours starting from current hour
    const rawChartData = data.slice(nowIndex, nowIndex + 12);

    // Filter to only entries with valid values
    const validData = rawChartData.filter(d => config.valueExtractor(d) !== undefined && config.valueExtractor(d) !== null);
    if (validData.length < 2) return null;

    // Apply EWMA smoothing
    const smoothedValues = React.useMemo(() => {
        const values = rawChartData.map(d => config.valueExtractor(d));
        if (values.length === 0) return [];
        const alpha = 0.4;
        const smoothed: (number | undefined)[] = [values[0]];
        for (let i = 1; i < values.length; i++) {
            const prev = smoothed[i - 1];
            const curr = values[i];
            if (curr !== undefined && prev !== undefined) {
                smoothed.push(alpha * curr + (1 - alpha) * prev);
            } else {
                smoothed.push(curr);
            }
        }
        return smoothed;
    }, [rawChartData, config]);

    // Build chart data with smoothed values, skip undefined
    const chartData = rawChartData
        .map((d, i) => ({ ...d, _value: smoothedValues[i] }))
        .filter(d => d._value !== undefined) as (HourlyData & { _value: number })[];

    if (chartData.length < 2) return null;

    const chartHeight = height;
    const paddingTop = 30;
    const paddingBottom = 45;
    const paddingHorizontal = 15;

    // Calculate Y range
    const values = chartData.map(d => d._value);
    let minVal: number, maxVal: number;

    if (config.fixedYRange) {
        minVal = config.fixedYRange.min;
        maxVal = config.fixedYRange.max;
    } else {
        minVal = Math.min(...values) - 1;
        maxVal = Math.max(...values) + 1;
        if (config.minYRange) {
            const range = maxVal - minVal;
            if (range < config.minYRange) {
                const center = (maxVal + minVal) / 2;
                minVal = center - config.minYRange / 2;
                maxVal = center + config.minYRange / 2;
            }
        }
    }
    const valRange = maxVal - minVal || 1;

    // Calculate points
    const graphHeight = chartHeight - paddingTop - paddingBottom;
    const stepX = (chartWidth - paddingHorizontal * 2) / (chartData.length - 1);

    const points = chartData.map((item, index) => {
        const x = paddingHorizontal + index * stepX;
        const y = paddingTop + graphHeight - ((item._value - minVal) / valRange) * graphHeight;
        return { x, y, ...item };
    });

    // Create smooth Bezier path
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
        <View
            style={[
                styles.container,
                {
                    backgroundColor: cardBg,
                    padding: isTablet ? 24 : 16,
                    paddingBottom: isTablet ? 16 : 8,
                    borderRadius: isTablet ? 24 : 20
                }
            ]}
            onLayout={(e) => {
                const layoutWidth = e.nativeEvent.layout.width;
                setChartWidth(layoutWidth - (isTablet ? 48 : 32));
            }}
        >
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: textColor }]}>
                    {selectedIndex !== null ? 'Detail' : t(config.titleKey, language)}
                </Text>
                {config.summaryFn && config.summaryFn(chartData) && (
                    <Text style={[styles.summaryText, { color: textColor }]}>
                        {config.summaryFn(chartData)}
                    </Text>
                )}
            </View>

            <View>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        <LinearGradient id={`${config.gradientId}Fill`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={config.lineColor} stopOpacity="0.4" />
                            <Stop offset="100%" stopColor={config.lineColor} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Bar chart (e.g. precipitation mm) */}
                    {config.barExtractor && points.map((point, index) => {
                        const barVal = config.barExtractor!(point);
                        if (barVal === undefined || barVal === null || barVal <= 0) return null;
                        const maxBar = config.barMaxValue || 5;
                        const clampedVal = Math.min(barVal, maxBar);
                        const barMaxH = graphHeight * 0.6;
                        const barH = (clampedVal / maxBar) * barMaxH;
                        const barW = Math.max(stepX * 0.4, 6);
                        const barY = paddingTop + graphHeight - barH;
                        return (
                            <Rect
                                key={`bar-${index}`}
                                x={point.x - barW / 2}
                                y={barY}
                                width={barW}
                                height={barH}
                                rx={barW / 2}
                                fill={config.barColor || config.lineColor}
                                opacity={0.35}
                            />
                        );
                    })}

                    <Path d={fillPath} fill={`url(#${config.gradientId}Fill)`} />
                    <Path d={linePath} stroke={config.lineColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Interactive Areas */}
                    {points.map((point, index) => (
                        <G key={index} onPress={() => setSelectedIndex(index === selectedIndex ? null : index)}>
                            <Circle cx={point.x} cy={point.y} r={20} fill="transparent" />
                            <Circle
                                cx={point.x}
                                cy={point.y}
                                r={selectedIndex === index ? 6 : 4}
                                fill={selectedIndex === index ? "#ffeb3b" : "#fff"}
                                stroke={config.lineColor}
                                strokeWidth={2}
                            />

                            {selectedIndex !== index && (index % (config.labelInterval || 1) === 0) && (
                                <SvgText
                                    x={point.x}
                                    y={point.y - 12}
                                    fontSize={12}
                                    fontWeight="600"
                                    fill={textColor}
                                    textAnchor="middle"
                                >
                                    {config.formatValue(point._value)}
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
                                    {formatHour(point.time, index, language, settings.time_format as TimeFormat)}
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
                            {formatHour(selectedPoint.time, 1, language, settings.time_format as TimeFormat)} {'\u2022'} {config.formatValue(selectedPoint._value)}
                        </Text>
                        {config.tooltipExtra && config.tooltipExtra(selectedPoint) && (
                            <Text style={styles.tooltipSub}>
                                {config.tooltipExtra(selectedPoint)}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

// Chart Configurations

export const WIND_CHART_CONFIG: ChartConfig = {
    titleKey: 'wind_trend',
    valueExtractor: (d) => d.wind_speed,
    formatValue: (v) => `${Math.round(v)}`,
    lineColor: '#10B981',
    gradientId: 'windGradient',
};

export const PRESSURE_CHART_CONFIG: ChartConfig = {
    titleKey: 'pressure_trend',
    valueExtractor: (d) => d.pressure,
    formatValue: (v) => `${Math.round(v)}`,
    lineColor: '#8B5CF6',
    gradientId: 'pressureGradient',
    minYRange: 10,
    labelInterval: 3,
};

export const PRECIPITATION_CHART_CONFIG: ChartConfig = {
    titleKey: 'precipitation_trend',
    valueExtractor: (d) => d.precipitation_probability,
    formatValue: (v) => `${Math.round(v)}%`,
    lineColor: '#3B82F6',
    gradientId: 'precipGradient',
    fixedYRange: { min: 0, max: 100 },
    tooltipExtra: (d) => d.precipitation_amount !== undefined && d.precipitation_amount !== null
        ? `${d.precipitation_amount} mm`
        : null,
    summaryFn: (data) => {
        const total = data.reduce((sum, d) => sum + (d.precipitation_amount || 0), 0);
        return total > 0 ? `${total.toFixed(1)} mm` : null;
    },
    barExtractor: (d) => d.precipitation_amount,
    barColor: '#3B82F6',
    barMaxValue: 5,
};

const styles = StyleSheet.create({
    container: {
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.7,
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
    tooltipSub: {
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'center',
    },
});
