'use client';

import { useMemo } from 'react';

interface ChartDataPoint {
    label: string;
    value: number;
    highlight?: boolean;
}

interface WeatherChartProps {
    data: ChartDataPoint[];
    height?: number;
    color?: string;
    showDots?: boolean;
    showArea?: boolean;
    showLabels?: boolean;
    unit?: string;
    isDark?: boolean;
    minValue?: number;
    maxValue?: number;
}

export function WeatherChart({
    data,
    height = 120,
    color = '#3b82f6',
    showDots = true,
    showArea = true,
    showLabels = true,
    unit = '',
    isDark = false,
    minValue,
    maxValue,
}: WeatherChartProps) {
    const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const { points, areaPath, linePath, yMin, yMax } = useMemo(() => {
        if (data.length === 0) return { points: [], areaPath: '', linePath: '', yMin: 0, yMax: 0 };

        const values = data.map(d => d.value);
        let computedMin = minValue !== undefined ? minValue : Math.min(...values);
        let computedMax = maxValue !== undefined ? maxValue : Math.max(...values);

        // Ensure minimum range to prevent squashed graphs
        const rawRange = computedMax - computedMin;
        const minRange = 20; // Minimum 20 units range for better visualization

        if (rawRange < minRange) {
            const center = (computedMax + computedMin) / 2;
            computedMin = center - minRange / 2;
            computedMax = center + minRange / 2;
        } else {
            // Add 10% padding to top and bottom
            const padding = rawRange * 0.1;
            if (minValue === undefined) computedMin -= padding;
            if (maxValue === undefined) computedMax += padding;
        }

        const yMin = computedMin;
        const yMax = computedMax;
        const yRange = yMax - yMin || 1;

        const chartPadding = { top: 20, right: 10, bottom: 30, left: 10 };
        const chartWidth = 100; // percentage-based
        const chartHeight = height - chartPadding.top - chartPadding.bottom;

        const points = data.map((d, i) => {
            const x = chartPadding.left + (i / (data.length - 1)) * (chartWidth - chartPadding.left - chartPadding.right);
            const y = chartPadding.top + (1 - (d.value - yMin) / yRange) * chartHeight;
            return { x, y, ...d };
        });

        // Create SVG paths
        const linePath = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

        const areaPath = linePath +
            ` L ${points[points.length - 1].x} ${height - chartPadding.bottom}` +
            ` L ${points[0].x} ${height - chartPadding.bottom} Z`;

        return { points, areaPath, linePath, yMin, yMax };
    }, [data, height, minValue, maxValue]);

    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center h-${height} ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                No data available
            </div>
        );
    }

    return (
        <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: `${height}px` }}
        >
            {/* Grid lines */}
            <line x1="10" y1="20" x2="90" y2="20" stroke={gridColor} strokeWidth="0.3" />
            <line x1="10" y1={height / 2} x2="90" y2={height / 2} stroke={gridColor} strokeWidth="0.3" />
            <line x1="10" y1={height - 30} x2="90" y2={height - 30} stroke={gridColor} strokeWidth="0.3" />

            {/* Area fill */}
            {showArea && (
                <path
                    d={areaPath}
                    fill={`${color}20`}
                />
            )}

            {/* Line */}
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots and labels */}
            {points.map((point, i) => (
                <g key={i}>
                    {showDots && (
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={point.highlight ? 3 : 2}
                            fill={point.highlight ? color : 'white'}
                            stroke={color}
                            strokeWidth="1"
                        />
                    )}
                    {showLabels && i % Math.ceil(data.length / 6) === 0 && (
                        <text
                            x={point.x}
                            y={height - 10}
                            textAnchor="middle"
                            fill={textColor}
                            fontSize="6"
                        >
                            {point.label}
                        </text>
                    )}
                </g>
            ))}

            {/* Y-axis labels */}
            <text x="8" y="23" textAnchor="end" fill={textColor} fontSize="5">
                {Math.round(yMax)}{unit}
            </text>
            <text x="8" y={height - 27} textAnchor="end" fill={textColor} fontSize="5">
                {Math.round(yMin)}{unit}
            </text>
        </svg>
    );
}
