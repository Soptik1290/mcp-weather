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

// Sunrise/Sunset Card
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, type: 'spring' }}
        >
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
                <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                        <Sunrise className={`w-5 h-5 ${subTextColor}`} />
                        <div>
                            <p className={`text-xs ${subTextColor}`}>{t('sunrise')}</p>
                            <p className={`text-lg font-medium ${textColor}`}>{formatTime(sunrise)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className={`text-xs ${subTextColor}`}>{t('sunset')}</p>
                            <p className={`text-lg font-medium ${textColor}`}>{formatTime(sunset)}</p>
                        </div>
                        <Sunset className={`w-5 h-5 ${subTextColor}`} />
                    </div>
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
