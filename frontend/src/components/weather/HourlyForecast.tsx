'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-icons';
import { HourlyForecast } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSettings } from '@/lib/settings';

interface HourlyForecastProps {
    forecast: HourlyForecast[];
    isDark?: boolean;
}

export function HourlyForecastCard({ forecast, isDark = false }: HourlyForecastProps) {
    const { formatTemperature, formatTime, t } = useSettings();
    const scrollRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLDivElement>(null);

    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';
    const nowHighlight = isDark ? 'bg-blue-500/20 border-2 border-blue-400' : 'bg-blue-50 border-2 border-blue-400';

    // Find current hour and build timeline
    const now = new Date();
    const currentHour = now.getHours();

    // Create past hours (6 hours before now)
    const hoursBeforeNow = 6;
    const timeline: Array<{ time: Date; temperature: number; weather_code: number; precipitation_probability?: number; isNow: boolean; isPast: boolean }> = [];

    // Add past hours
    for (let i = hoursBeforeNow; i > 0; i--) {
        const pastTime = new Date(now);
        pastTime.setHours(currentHour - i, 0, 0, 0);

        timeline.push({
            time: pastTime,
            temperature: forecast[0]?.temperature || 0,
            weather_code: forecast[0]?.weather_code || 0,
            precipitation_probability: 0,
            isNow: false,
            isPast: true,
        });
    }

    // Add current hour (Now)
    const nowTime = new Date(now);
    nowTime.setMinutes(0, 0, 0);
    timeline.push({
        time: nowTime,
        temperature: forecast[0]?.temperature || 0,
        weather_code: forecast[0]?.weather_code || 0,
        precipitation_probability: forecast[0]?.precipitation_probability,
        isNow: true,
        isPast: false,
    });

    // Add future hours from forecast (skip first as it's "now")
    forecast.slice(1, 18).forEach((hour) => {
        const hourTime = new Date(hour.time);
        timeline.push({
            time: hourTime,
            temperature: hour.temperature,
            weather_code: hour.weather_code,
            precipitation_probability: hour.precipitation_probability,
            isNow: false,
            isPast: false,
        });
    });

    // Auto-scroll to "Now" on mount
    useEffect(() => {
        if (nowRef.current && scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                const nowElement = nowRef.current;
                const containerWidth = scrollContainer.clientWidth;
                const scrollPosition = nowElement.offsetLeft - (containerWidth / 2) + (nowElement.clientWidth / 2);
                scrollContainer.scrollLeft = Math.max(0, scrollPosition);
            }
        }
    }, [forecast]);

    return (
        <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 overflow-visible`}>
            <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                {t('hourly_forecast')}
            </h3>

            <ScrollArea className="w-full" ref={scrollRef}>
                <div className="flex gap-2 py-1 px-1">
                    {timeline.map((item, index) => {
                        const WeatherIcon = getWeatherIcon(item.weather_code);
                        const hourStr = item.isNow ? t('now') : formatTime(item.time);

                        return (
                            <motion.div
                                key={`${item.time.toISOString()}-${index}`}
                                ref={item.isNow ? nowRef : undefined}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.015 }}
                                className={`
                                    flex flex-col items-center gap-1 min-w-[60px] py-2 px-2 rounded-xl
                                    ${item.isNow ? nowHighlight : ''}
                                    ${item.isPast ? 'opacity-40' : ''}
                                `}
                            >
                                <span className={`text-xs font-medium ${item.isNow ? (isDark ? 'text-blue-300' : 'text-blue-600') : subTextColor}`}>
                                    {hourStr}
                                </span>
                                <WeatherIcon className={`w-6 h-6 ${item.isPast ? subTextColor : textColor}`} />
                                <span className={`text-sm font-medium ${item.isPast ? subTextColor : textColor}`}>
                                    {formatTemperature(item.temperature)}
                                </span>
                                {!item.isPast && item.precipitation_probability !== undefined && item.precipitation_probability > 0 && (
                                    <span className="text-xs text-blue-400">
                                        {Math.round(item.precipitation_probability)}%
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </Card>
    );
}
