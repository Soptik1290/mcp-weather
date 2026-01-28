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

// Wind Speed Card
export function WindCard({ speed, direction, isDark }: { speed?: number; direction?: number; isDark?: boolean }) {
    const { t } = useSettings();
    const directionLabel = direction !== undefined ? getWindDirection(direction, t) : '';

    return (
        <DetailCard
            title={t('wind')}
            value={speed !== undefined ? Math.round(speed) : '--'}
            unit="km/h"
            icon={Wind}
            subtitle={directionLabel}
            isDark={isDark}
            delay={0.1}
        />
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

// UV Index Card
export function UVIndexCard({ uvIndex, isDark }: { uvIndex?: number | null; isDark?: boolean }) {
    const { t } = useSettings();
    const hasValue = uvIndex != null && !isNaN(uvIndex);
    const level = hasValue ? getUVLevel(uvIndex, t) : '';

    return (
        <DetailCard
            title={t('uv_index')}
            value={hasValue ? uvIndex.toFixed(1) : '--'}
            icon={Sun}
            subtitle={level}
            isDark={isDark}
            delay={0.2}
        />
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
