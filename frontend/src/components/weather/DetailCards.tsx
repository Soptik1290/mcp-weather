'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Wind, Droplets, Sun, Sunrise, Sunset, CloudRain, type LucideIcon } from 'lucide-react';
import { useSettings } from '@/lib/settings';

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


// Wind Speed Card with Compass
export function WindCard({ speed, direction, isDark }: { speed?: number; direction?: number; isDark?: boolean }) {
    const { t } = useSettings();
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    // Get wind intensity color (green = calm, red = strong)
    const getWindColor = (s: number): string => {
        if (s < 10) return '#22c55e'; // green - calm
        if (s < 20) return '#84cc16'; // lime - light
        if (s < 35) return '#eab308'; // yellow - moderate
        if (s < 50) return '#f97316'; // orange - strong
        if (s < 75) return '#ef4444'; // red - very strong
        return '#dc2626'; // dark red - storm
    };

    const windColor = speed !== undefined ? getWindColor(speed) : '#6b7280';
    const directionLabel = direction !== undefined ? getWindDirection(direction, t) : '--';
    const rotation = direction !== undefined ? direction : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
        >
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full`}>
                <div className="flex items-center gap-2 mb-2">
                    <Wind className={`w-4 h-4 ${subTextColor}`} />
                    <span className={`text-sm ${subTextColor}`}>{t('wind')}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {speed !== undefined ? Math.round(speed) : '--'}
                            <span className="text-lg ml-1">km/h</span>
                        </div>
                        <p className={`text-sm ${subTextColor} mt-1`}>{directionLabel}</p>
                    </div>

                    {/* Compass SVG */}
                    <div className="relative w-14 h-14">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Compass circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                                strokeWidth="2"
                            />
                            {/* Cardinal directions */}
                            <text x="50" y="15" textAnchor="middle" className={`text-[10px] ${isDark ? 'fill-white/60' : 'fill-gray-400'}`}>N</text>
                            <text x="90" y="54" textAnchor="middle" className={`text-[10px] ${isDark ? 'fill-white/60' : 'fill-gray-400'}`}>E</text>
                            <text x="50" y="95" textAnchor="middle" className={`text-[10px] ${isDark ? 'fill-white/60' : 'fill-gray-400'}`}>S</text>
                            <text x="10" y="54" textAnchor="middle" className={`text-[10px] ${isDark ? 'fill-white/60' : 'fill-gray-400'}`}>W</text>
                            {/* Wind direction arrow */}
                            <g transform={`rotate(${rotation}, 50, 50)`}>
                                <polygon
                                    points="50,15 45,40 50,35 55,40"
                                    fill={windColor}
                                />
                                <line
                                    x1="50"
                                    y1="35"
                                    x2="50"
                                    y2="70"
                                    stroke={windColor}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </g>
                            {/* Center dot */}
                            <circle cx="50" cy="50" r="4" fill={windColor} />
                        </svg>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Humidity Card
export function HumidityCard({ humidity, isDark }: { humidity?: number; isDark?: boolean }) {
    const { t } = useSettings();
    const level = humidity !== undefined ? getHumidityLevel(humidity, t) : '';

    return (
        <DetailCard
            title={t('humidity')}
            value={humidity !== undefined ? Math.round(humidity) : '--'}
            unit="%"
            icon={Droplets}
            subtitle={level}
            isDark={isDark}
            delay={0.15}
        />
    );
}

// UV Index Card with Gauge
export function UVIndexCard({ uvIndex, isDark }: { uvIndex?: number | null; isDark?: boolean }) {
    const { t } = useSettings();
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const hasValue = uvIndex != null && !isNaN(uvIndex);
    const level = hasValue ? getUVLevel(uvIndex, t) : '';
    const value = hasValue ? Math.min(uvIndex, 11) : 0;

    // Calculate needle angle (0 UV = -90deg, 11 UV = 90deg)
    const needleAngle = hasValue ? -90 + (value / 11) * 180 : -90;

    // Get color for current UV value
    const getUVColor = (uv: number): string => {
        if (uv < 3) return '#22c55e'; // green - low
        if (uv < 6) return '#eab308'; // yellow - moderate
        if (uv < 8) return '#f97316'; // orange - high
        if (uv < 11) return '#ef4444'; // red - very high
        return '#a855f7'; // purple - extreme
    };

    const uvColor = hasValue ? getUVColor(uvIndex) : '#6b7280';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
        >
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 h-full`}>
                <div className="flex items-center gap-2 mb-2">
                    <Sun className={`w-4 h-4 ${subTextColor}`} />
                    <span className={`text-sm ${subTextColor}`}>{t('uv_index')}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className={`text-2xl font-semibold ${textColor}`}>
                            {hasValue ? uvIndex.toFixed(1) : '--'}
                        </div>
                        <p className={`text-sm ${subTextColor} mt-1`}>{level}</p>
                    </div>

                    {/* UV Gauge SVG */}
                    <div className="relative w-16 h-10">
                        <svg viewBox="0 0 100 55" className="w-full h-full">
                            {/* Background arc segments */}
                            <defs>
                                <linearGradient id="uvGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="27%" stopColor="#eab308" />
                                    <stop offset="54%" stopColor="#f97316" />
                                    <stop offset="82%" stopColor="#ef4444" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M 10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke="url(#uvGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            {/* Needle */}
                            <g transform={`rotate(${needleAngle}, 50, 50)`}>
                                <line
                                    x1="50"
                                    y1="50"
                                    x2="50"
                                    y2="18"
                                    stroke={uvColor}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </g>
                            {/* Center dot */}
                            <circle cx="50" cy="50" r="4" fill={uvColor} />
                            {/* Scale labels */}
                            <text x="8" y="54" className={`text-[8px] ${isDark ? 'fill-white/50' : 'fill-gray-400'}`}>0</text>
                            <text x="88" y="54" className={`text-[8px] ${isDark ? 'fill-white/50' : 'fill-gray-400'}`}>11</text>
                        </svg>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Rain/Precipitation Card
export function RainCard({
    probability,
    amount,
    isDark
}: {
    probability?: number | null;
    amount?: number | null;
    isDark?: boolean
}) {
    const { t } = useSettings();
    const hasProb = probability != null && !isNaN(probability);
    const hasAmount = amount != null && !isNaN(amount);

    // Subtitle shows mm if available
    const subtitle = hasAmount ? `${amount.toFixed(1)} mm` : (hasProb && probability > 0 ? t('expected') : '');

    return (
        <DetailCard
            title={t('rain')}
            value={hasProb ? Math.round(probability) : '--'}
            unit="%"
            icon={CloudRain}
            subtitle={subtitle}
            isDark={isDark}
            delay={0.25}
        />
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
