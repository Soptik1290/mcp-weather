'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Wind, Droplets, Sun, Sunrise, Sunset, CloudRain, type LucideIcon } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { WeatherDetailModal } from './WeatherDetailModal';
import { WeatherChart } from './WeatherChart';
import type { HourlyForecast } from '@/lib/types';

interface DetailCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    subtitle?: string;
    isDark?: boolean;
    delay?: number;
}

export function DetailCard({
    title,
    value,
    unit,
    icon: Icon,
    subtitle,
    isDark = false,
    delay = 0,
}: DetailCardProps) {
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: 'spring' }}
        >
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full`}>
                <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${subTextColor}`} />
                    <span className={`text-sm ${subTextColor}`}>{title}</span>
                </div>

                <div className={`text-2xl font-semibold ${textColor}`}>
                    {value}
                    {unit && <span className="text-lg ml-1">{unit}</span>}
                </div>

                {subtitle && (
                    <p className={`text-sm ${subTextColor} mt-1`}>{subtitle}</p>
                )}
            </Card>
        </motion.div>
    );
}

// Wind Speed Card - Elegant Compass (Clickable)
export function WindCard({
    speed,
    direction,
    isDark,
    hourlyData
}: {
    speed?: number;
    direction?: number;
    isDark?: boolean;
    hourlyData?: HourlyForecast[];
}) {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';
    const strokeColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)';
    const arrowColor = isDark ? '#60a5fa' : '#3b82f6';

    const directionLabel = direction !== undefined ? getWindDirection(direction, t) : '--';
    const rotation = direction !== undefined ? direction : 0;

    // Prepare chart data from hourly forecast
    const chartData = hourlyData?.slice(0, 24).map((hour, i) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: hour.wind_speed || 0,
        highlight: i === 0,
    })) || [];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                onClick={() => hourlyData && setIsOpen(true)}
                className={hourlyData ? 'cursor-pointer' : ''}
            >
                <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full transition-transform hover:scale-[1.02]`}>
                    <div className={`text-xs uppercase tracking-wide ${subTextColor} mb-3 text-center`}>
                        {t('wind')}
                    </div>

                    {/* Compass */}
                    <div className="flex justify-center mb-3">
                        <div className="relative w-16 h-16">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {/* Outer ring */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                />
                                {/* Arrow - using SVG transform */}
                                <g transform={`rotate(${rotation}, 50, 50)`}>
                                    <polygon
                                        points="50,12 44,50 50,45 56,50"
                                        fill={arrowColor}
                                    />
                                    <polygon
                                        points="50,88 44,50 50,55 56,50"
                                        fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                                    />
                                </g>
                                {/* Center dot */}
                                <circle cx="50" cy="50" r="5" fill={arrowColor} />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {speed !== undefined ? Math.round(speed) : '--'}
                            <span className="text-lg ml-1 font-normal">km/h</span>
                        </div>
                        <p className={`text-sm ${subTextColor}`}>{directionLabel}</p>
                    </div>
                </Card>
            </motion.div>

            <WeatherDetailModal
                open={isOpen}
                onOpenChange={setIsOpen}
                title={t('wind')}
                subtitle={`${t('current')}: ${speed !== undefined ? Math.round(speed) : '--'} km/h ${directionLabel}`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <p className={`text-sm ${subTextColor}`}>{t('next_24_hours')}</p>
                    {chartData.length > 0 ? (
                        <WeatherChart
                            data={chartData}
                            height={150}
                            color="#3b82f6"
                            unit=" km/h"
                            isDark={isDark}
                            showArea={true}
                        />
                    ) : (
                        <p className={`text-sm ${subTextColor}`}>No hourly data available</p>
                    )}
                </div>
            </WeatherDetailModal>
        </>
    );
}

// Humidity Card - Droplet with Fill Level (Clickable)
export function HumidityCard({
    humidity,
    isDark,
    hourlyData
}: {
    humidity?: number;
    isDark?: boolean;
    hourlyData?: HourlyForecast[];
}) {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';
    const level = humidity !== undefined ? getHumidityLevel(humidity, t) : '';
    const fillPercent = humidity !== undefined ? Math.min(humidity, 100) : 0;

    // Prepare chart data
    const chartData = hourlyData?.slice(0, 24).map((hour, i) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: hour.humidity || 0,
        highlight: i === 0,
    })) || [];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring' }}
                onClick={() => hourlyData && setIsOpen(true)}
                className={hourlyData ? 'cursor-pointer' : ''}
            >
                <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full transition-transform hover:scale-[1.02]`}>
                    <div className={`text-xs uppercase tracking-wide ${subTextColor} mb-3 text-center`}>
                        {t('humidity')}
                    </div>

                    {/* Droplet */}
                    <div className="flex justify-center mb-3">
                        <div className="relative w-12 h-16">
                            <svg viewBox="0 0 60 80" className="w-full h-full">
                                <defs>
                                    <clipPath id="dropletClip">
                                        <path d="M30 5 C30 5, 5 35, 5 50 C5 65, 15 75, 30 75 C45 75, 55 65, 55 50 C55 35, 30 5, 30 5 Z" />
                                    </clipPath>
                                </defs>
                                {/* Droplet outline */}
                                <path
                                    d="M30 5 C30 5, 5 35, 5 50 C5 65, 15 75, 30 75 C45 75, 55 65, 55 50 C55 35, 30 5, 30 5 Z"
                                    fill="none"
                                    stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)'}
                                    strokeWidth="2"
                                />
                                {/* Fill level - grows from bottom */}
                                <rect
                                    x="0"
                                    y={75 - (fillPercent * 0.7)}
                                    width="60"
                                    height={fillPercent * 0.7 + 5}
                                    fill={isDark ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.4)'}
                                    clipPath="url(#dropletClip)"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {humidity !== undefined ? Math.round(humidity) : '--'}
                            <span className="text-lg ml-1 font-normal">%</span>
                        </div>
                        <p className={`text-sm ${subTextColor}`}>{level}</p>
                    </div>
                </Card>
            </motion.div>

            <WeatherDetailModal
                open={isOpen}
                onOpenChange={setIsOpen}
                title={t('humidity')}
                subtitle={`${t('current')}: ${humidity !== undefined ? Math.round(humidity) : '--'}% - ${level}`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <p className={`text-sm ${subTextColor}`}>{t('next_24_hours')}</p>
                    {chartData.length > 0 ? (
                        <WeatherChart
                            data={chartData}
                            height={150}
                            color="#06b6d4"
                            unit="%"
                            isDark={isDark}
                            showArea={true}
                            minValue={0}
                            maxValue={100}
                        />
                    ) : (
                        <p className={`text-sm ${subTextColor}`}>No hourly data available</p>
                    )}
                </div>
            </WeatherDetailModal>
        </>
    );
}

// UV Index Card - Thin Arc Gauge (Clickable)
export function UVIndexCard({
    uvIndex,
    isDark,
    hourlyData
}: {
    uvIndex?: number | null;
    isDark?: boolean;
    hourlyData?: HourlyForecast[];
}) {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const hasValue = uvIndex != null && !isNaN(uvIndex);
    const level = hasValue ? getUVLevel(uvIndex, t) : '';
    const value = hasValue ? Math.min(uvIndex, 11) : 0;

    // Calculate dot position on arc (0-11 scale)
    const angle = -90 + (value / 11) * 180;
    const radius = 40;
    const dotX = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const dotY = 50 + radius * Math.sin((angle * Math.PI) / 180);

    // Note: Hourly UV data usually not available, but we'll show what we have
    const chartData = hourlyData?.slice(0, 24).map((hour, i) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: 0, // UV not in hourly data usually
        highlight: i === 0,
    })) || [];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                onClick={() => setIsOpen(true)}
                className="cursor-pointer"
            >
                <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full transition-transform hover:scale-[1.02]`}>
                    <div className={`text-xs uppercase tracking-wide ${subTextColor} mb-3 text-center`}>
                        {t('uv_index')}
                    </div>

                    {/* Arc Gauge - larger */}
                    <div className="flex justify-center mb-2">
                        <div className="relative w-20 h-12">
                            <svg viewBox="0 0 100 55" className="w-full h-full">
                                <defs>
                                    <linearGradient id="uvArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#22c55e" />
                                        <stop offset="30%" stopColor="#eab308" />
                                        <stop offset="60%" stopColor="#f97316" />
                                        <stop offset="85%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                                {/* Arc */}
                                <path
                                    d="M 10 50 A 40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke="url(#uvArcGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                />
                                {/* Indicator dot */}
                                <circle
                                    cx={dotX}
                                    cy={dotY}
                                    r="6"
                                    fill="white"
                                    stroke={isDark ? '#1f2937' : '#e5e7eb'}
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {hasValue ? uvIndex.toFixed(1) : '--'}
                        </div>
                        <p className={`text-sm ${subTextColor}`}>{level}</p>
                    </div>
                </Card>
            </motion.div>

            <WeatherDetailModal
                open={isOpen}
                onOpenChange={setIsOpen}
                title={t('uv_index')}
                subtitle={`${t('current')}: ${hasValue ? uvIndex.toFixed(1) : '--'} - ${level}`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${subTextColor} mb-2`}>{t('uv_protection_tips')}</p>
                        <ul className={`text-sm ${textColor} space-y-1`}>
                            {value < 3 && <li>☀️ {t('uv_low_tip')}</li>}
                            {value >= 3 && value < 6 && <li>🧴 {t('uv_moderate_tip')}</li>}
                            {value >= 6 && value < 8 && <li>🕶️ {t('uv_high_tip')}</li>}
                            {value >= 8 && <li>⚠️ {t('uv_very_high_tip')}</li>}
                        </ul>
                    </div>
                </div>
            </WeatherDetailModal>
        </>
    );
}

// Rain Card - Cloud with Animated Droplets (Clickable)
export function RainCard({
    probability,
    amount,
    isDark,
    hourlyData
}: {
    probability?: number | null;
    amount?: number | null;
    isDark?: boolean;
    hourlyData?: HourlyForecast[];
}) {
    const { t } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const hasProb = probability != null && !isNaN(probability);
    const hasAmount = amount != null && !isNaN(amount);
    const subtitle = hasAmount ? `${amount.toFixed(1)} mm` : '';
    const showDrops = hasProb && probability > 20;

    // Prepare chart data
    const chartData = hourlyData?.slice(0, 24).map((hour, i) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: hour.precipitation_probability || 0,
        highlight: i === 0,
    })) || [];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, type: 'spring' }}
                onClick={() => hourlyData && setIsOpen(true)}
                className={hourlyData ? 'cursor-pointer' : ''}
            >
                <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full transition-transform hover:scale-[1.02]`}>
                    <div className={`text-xs uppercase tracking-wide ${subTextColor} mb-3 text-center`}>
                        {t('rain')}
                    </div>

                    {/* Cloud with drops */}
                    <div className="flex justify-center mb-3">
                        <div className="relative w-16 h-12">
                            <svg viewBox="0 0 100 75" className="w-full h-full">
                                {/* Cloud */}
                                <path
                                    d="M25 45 C10 45, 10 30, 25 28 C25 15, 45 10, 55 20 C75 15, 90 25, 85 40 C95 45, 90 55, 75 55 L25 55 C10 55, 10 45, 25 45 Z"
                                    fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.3)'}
                                />
                                {/* Rain drops - animated */}
                                {showDrops && (
                                    <>
                                        <motion.line
                                            x1="35" y1="58" x2="35" y2="68"
                                            stroke={isDark ? '#60a5fa' : '#3b82f6'}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            animate={{ y: [0, 5, 0], opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.line
                                            x1="50" y1="60" x2="50" y2="72"
                                            stroke={isDark ? '#60a5fa' : '#3b82f6'}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            animate={{ y: [0, 5, 0], opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                                        />
                                        <motion.line
                                            x1="65" y1="58" x2="65" y2="68"
                                            stroke={isDark ? '#60a5fa' : '#3b82f6'}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            animate={{ y: [0, 5, 0], opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {hasProb ? Math.round(probability) : '--'}
                            <span className="text-lg ml-1 font-normal">%</span>
                        </div>
                        <p className={`text-sm ${subTextColor}`}>{subtitle}</p>
                    </div>
                </Card>
            </motion.div>

            <WeatherDetailModal
                open={isOpen}
                onOpenChange={setIsOpen}
                title={t('rain')}
                subtitle={`${t('current')}: ${hasProb ? Math.round(probability) : '--'}% ${subtitle ? `• ${subtitle}` : ''}`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <p className={`text-sm ${subTextColor}`}>{t('precipitation_probability')}</p>
                    {chartData.length > 0 ? (
                        <WeatherChart
                            data={chartData}
                            height={150}
                            color="#3b82f6"
                            unit="%"
                            isDark={isDark}
                            showArea={true}
                            minValue={0}
                            maxValue={100}
                        />
                    ) : (
                        <p className={`text-sm ${subTextColor}`}>No hourly data available</p>
                    )}
                </div>
            </WeatherDetailModal>
        </>
    );
}

// Sunrise/Sunset Card (compact with midday)
export function SunTimesCard({
    sunrise,
    sunset,
    isDark
}: {
    sunrise?: string;
    sunset?: string;
    isDark?: boolean
}) {
    const { t, formatTime: formatTimeSettings } = useSettings();
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const formatTime = (isoTime?: string) => {
        if (!isoTime) return '--:--';
        const date = new Date(isoTime);
        return formatTimeSettings(date);
    };

    // Calculate solar noon (midday) as midpoint between sunrise and sunset
    const getMidday = () => {
        if (!sunrise || !sunset) return '--:--';
        const sunriseDate = new Date(sunrise);
        const sunsetDate = new Date(sunset);
        const middayMs = (sunriseDate.getTime() + sunsetDate.getTime()) / 2;
        return formatTimeSettings(new Date(middayMs));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, type: 'spring' }}
        >
            <Card className={`p-3 ${bgColor} backdrop-blur-md border-0 h-full`}>
                <div className="flex justify-between items-center gap-1">
                    <div className="flex items-center gap-1.5">
                        <Sunrise className={`w-4 h-4 ${subTextColor}`} />
                        <div>
                            <p className={`text-[10px] ${subTextColor}`}>{t('sunrise')}</p>
                            <p className={`text-sm font-medium ${textColor}`}>{formatTime(sunrise)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Sun className={`w-4 h-4 ${subTextColor}`} />
                        <div className="text-center">
                            <p className={`text-[10px] ${subTextColor}`}>{t('midday')}</p>
                            <p className={`text-sm font-medium ${textColor}`}>{getMidday()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className="text-right">
                            <p className={`text-[10px] ${subTextColor}`}>{t('sunset')}</p>
                            <p className={`text-sm font-medium ${textColor}`}>{formatTime(sunset)}</p>
                        </div>
                        <Sunset className={`w-4 h-4 ${subTextColor}`} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Moon Phase Card
export function MoonPhaseCard({
    moonPhase,
    isDark
}: {
    moonPhase?: number | string;
    isDark?: boolean
}) {
    const { t } = useSettings();
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    // Convert phase to 0-1 range if it's a string or percentage
    const getPhaseValue = (): number => {
        if (moonPhase === undefined || moonPhase === null) return 0.5;
        if (typeof moonPhase === 'string') {
            // Try to parse string like "Waxing Crescent" or number
            const num = parseFloat(moonPhase);
            if (!isNaN(num)) return num > 1 ? num / 100 : num;
            return 0.5;
        }
        return moonPhase > 1 ? moonPhase / 100 : moonPhase;
    };

    const phase = getPhaseValue();

    // Get moon phase name and emoji
    const getMoonPhaseInfo = (p: number): { name: string; emoji: string } => {
        if (p < 0.0625) return { name: t('moon_new'), emoji: '🌑' };
        if (p < 0.1875) return { name: t('moon_waxing_crescent'), emoji: '🌒' };
        if (p < 0.3125) return { name: t('moon_first_quarter'), emoji: '🌓' };
        if (p < 0.4375) return { name: t('moon_waxing_gibbous'), emoji: '🌔' };
        if (p < 0.5625) return { name: t('moon_full'), emoji: '🌕' };
        if (p < 0.6875) return { name: t('moon_waning_gibbous'), emoji: '🌖' };
        if (p < 0.8125) return { name: t('moon_last_quarter'), emoji: '🌗' };
        if (p < 0.9375) return { name: t('moon_waning_crescent'), emoji: '🌘' };
        return { name: t('moon_new'), emoji: '🌑' };
    };

    const phaseInfo = getMoonPhaseInfo(phase);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
        >
            <Card className={`p-3 ${bgColor} backdrop-blur-md border-0 h-full`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-[10px] ${subTextColor}`}>{t('moon_phase')}</p>
                        <p className={`text-sm font-medium ${textColor}`}>{phaseInfo.name}</p>
                    </div>
                    <span className="text-2xl" suppressHydrationWarning>{phaseInfo.emoji}</span>
                </div>
            </Card>
        </motion.div>
    );
}

// Helper functions - now with translations
function getWindDirection(degrees: number, t: (key: string) => string): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function getHumidityLevel(humidity: number, t: (key: string) => string): string {
    if (humidity < 30) return t('dry');
    if (humidity < 60) return t('comfortable');
    if (humidity < 80) return t('humid');
    return t('very_humid');
}

function getUVLevel(uv: number, t: (key: string) => string): string {
    if (uv < 3) return t('low');
    if (uv < 6) return t('moderate');
    if (uv < 8) return t('high');
    if (uv < 11) return t('very_high');
    return t('extreme');
}
