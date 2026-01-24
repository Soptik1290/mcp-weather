'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Wind, Droplets, Sun, Sunrise, Sunset, type LucideIcon } from 'lucide-react';

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
    const directionLabel = direction !== undefined ? getWindDirection(direction) : '';

    return (
        <DetailCard
            title="Wind"
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
    const level = humidity !== undefined ? getHumidityLevel(humidity) : '';

    return (
        <DetailCard
            title="Humidity"
            value={humidity !== undefined ? humidity : '--'}
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
    const hasValue = uvIndex != null && !isNaN(uvIndex);
    const level = hasValue ? getUVLevel(uvIndex) : '';

    return (
        <DetailCard
            title="UV Index"
            value={hasValue ? uvIndex.toFixed(1) : '--'}
            icon={Sun}
            subtitle={level}
            isDark={isDark}
            delay={0.2}
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
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const formatTime = (isoTime?: string) => {
        if (!isoTime) return '--:--';
        const date = new Date(isoTime);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
                            <p className={`text-xs ${subTextColor}`}>Sunrise</p>
                            <p className={`text-lg font-medium ${textColor}`}>{formatTime(sunrise)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className={`text-xs ${subTextColor}`}>Sunset</p>
                            <p className={`text-lg font-medium ${textColor}`}>{formatTime(sunset)}</p>
                        </div>
                        <Sunset className={`w-5 h-5 ${subTextColor}`} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Helper functions
function getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function getHumidityLevel(humidity: number): string {
    if (humidity < 30) return 'Dry';
    if (humidity < 60) return 'Comfortable';
    if (humidity < 80) return 'Humid';
    return 'Very humid';
}

function getUVLevel(uv: number): string {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
}
