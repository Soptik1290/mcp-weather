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
    height = 150,
    color = '#3b82f6',
    showDots = true,
    showArea = true,
    showLabels = true,
    unit = '',
    isDark = false,
    minValue,
    maxValue,
}: WeatherChartProps) {
    const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const chartWidth = 400;
    const chartHeight = height;
    const padding = { top: 25, right: 15, bottom: 35, left: 45 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const { points, areaPath, linePath, yMin, yMax, yMid } = useMemo(() => {
        if (data.length === 0) return { points: [], areaPath: '', linePath: '', yMin: 0, yMax: 0, yMid: 0 };

        const values = data.map(d => d.value);
        let computedMin = minValue !== undefined ? minValue : Math.min(...values);
        let computedMax = maxValue !== undefined ? maxValue : Math.max(...values);

        // Ensure minimum range to prevent squashed graphs
        const rawRange = computedMax - computedMin;
        const minRange = 20;

        if (rawRange < minRange) {
            const center = (computedMax + computedMin) / 2;
            computedMin = Math.floor(center - minRange / 2);
            computedMax = Math.ceil(center + minRange / 2);
        } else {
            // Add padding
            const rangePadding = rawRange * 0.15;
            if (minValue === undefined) computedMin = Math.floor(computedMin - rangePadding);
            if (maxValue === undefined) computedMax = Math.ceil(computedMax + rangePadding);
        }

        const yMin = computedMin;
        const yMax = computedMax;
        const yMid = Math.round((yMax + yMin) / 2);
        const yRange = yMax - yMin || 1;

        const points = data.map((d, i) => {
            const x = padding.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
            const y = padding.top + (1 - (d.value - yMin) / yRange) * plotHeight;
            return { x, y, ...d };
        });

        // Create SVG paths
        const linePath = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

        const areaPath = linePath +
            ` L ${points[points.length - 1].x} ${padding.top + plotHeight}` +
            ` L ${points[0].x} ${padding.top + plotHeight} Z`;

        return { points, areaPath, linePath, yMin, yMax, yMid };
    }, [data, minValue, maxValue, plotWidth, plotHeight, padding.left, padding.top]);

    if (data.length === 0) {
        return (
            <div className={`flex items-center justify-center ${isDark ? 'text-white/50' : 'text-gray-400'}`} style={{ height }}>
                No data available
            </div>
        );
    }

    // Calculate which labels to show (max 8)
    const labelStep = Math.ceil(data.length / 8);

    return (
        <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full"
            style={{ height: `${height}px` }}
        >
            {/* Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke={gridColor} strokeWidth="1" />
            <line x1={padding.left} y1={padding.top + plotHeight / 2} x2={chartWidth - padding.right} y2={padding.top + plotHeight / 2} stroke={gridColor} strokeWidth="1" strokeDasharray="4,4" />
            <line x1={padding.left} y1={padding.top + plotHeight} x2={chartWidth - padding.right} y2={padding.top + plotHeight} stroke={gridColor} strokeWidth="1" />

            {/* Area fill */}
            {showArea && (
                <path
                    d={areaPath}
                    fill={`${color}25`}
                />
            )}

            {/* Line */}
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {showDots && points.map((point, i) => (
                <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={point.highlight ? 5 : 3}
                    fill={point.highlight ? color : 'white'}
                    stroke={color}
                    strokeWidth="2"
                />
            ))}

            {/* X-axis labels */}
            {showLabels && points.map((point, i) => (
                i % labelStep === 0 && (
                    <text
                        key={`x-${i}`}
                        x={point.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        fontFamily="system-ui, sans-serif"
                    >
                        {point.label}
                    </text>
                )
            ))}

            {/* Y-axis labels */}
            <text
                x={padding.left - 8}
                y={padding.top + 4}
                textAnchor="end"
                fill={textColor}
                fontSize="11"
                fontFamily="system-ui, sans-serif"
            >
                {yMax}{unit}
            </text>
            <text
                x={padding.left - 8}
                y={padding.top + plotHeight / 2 + 4}
                textAnchor="end"
                fill={textColor}
                fontSize="11"
                fontFamily="system-ui, sans-serif"
            >
                {yMid}{unit}
            </text>
            <text
                x={padding.left - 8}
                y={padding.top + plotHeight + 4}
                textAnchor="end"
                fill={textColor}
                fontSize="11"
                fontFamily="system-ui, sans-serif"
            >
                {yMin}{unit}
            </text>
        </svg>
    );
}
