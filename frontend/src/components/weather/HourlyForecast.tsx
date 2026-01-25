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
    const nowHighlight = isDark ? 'bg-blue-500/30 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-400';

    // Find current hour index and create timeline with past + future hours
    const now = new Date();
    const currentHour = now.getHours();

    // Create a timeline: 6 hours before + now + 17 hours after = 24 hours total
    const hoursBeforeNow = 6;
    const timeline: Array<{ hour: HourlyForecast; isNow: boolean; isPast: boolean }> = [];

    // Find the index of "now" in forecast (first hour)
    const nowIndex = 0;

    // Add past hours (from forecast if available, or generate placeholder times)
    for (let i = hoursBeforeNow; i > 0; i--) {
        const pastHour = currentHour - i;
        const pastTime = new Date(now);
        pastTime.setHours(pastHour, 0, 0, 0);

        // Create a placeholder for past hours (we don't have past forecast data usually)
        timeline.push({
            hour: {
                time: pastTime.toISOString(),
                temperature: forecast[0]?.temperature || 0, // Use current temp as estimate
                weather_code: forecast[0]?.weather_code || 0,
                precipitation_probability: 0,
            },
            isNow: false,
            isPast: true,
        });
    }

    // Add current and future hours from forecast
    forecast.slice(0, 18).forEach((hour, index) => {
        timeline.push({
            hour,
            isNow: index === 0,
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
        <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
            <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                {t('hourly_forecast')}
            </h3>

            <ScrollArea className="w-full" ref={scrollRef}>
                <div className="flex gap-2 pb-2">
                    {timeline.map((item, index) => {
                        const WeatherIcon = getWeatherIcon(item.hour.weather_code);
                        const time = new Date(item.hour.time);
                        const hourStr = item.isNow ? t('now') : formatTime(time);

                        return (
                            <motion.div
                                key={`${item.hour.time}-${index}`}
                                ref={item.isNow ? nowRef : undefined}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.015 }}
                                className={`
                                    flex flex-col items-center gap-1 min-w-[65px] py-2 px-1 rounded-xl transition-all
                                    ${item.isNow ? nowHighlight : ''}
                                    ${item.isPast ? 'opacity-50' : ''}
                                `}
                            >
                                <span className={`text-xs font-medium ${item.isNow ? (isDark ? 'text-blue-300' : 'text-blue-600') : subTextColor}`}>
                                    {hourStr}
                                </span>
                                <WeatherIcon className={`w-6 h-6 ${item.isPast ? subTextColor : textColor}`} />
                                <span className={`text-sm font-medium ${item.isPast ? subTextColor : textColor}`}>
                                    {formatTemperature(item.hour.temperature)}
                                </span>
                                {!item.isPast && item.hour.precipitation_probability !== undefined && item.hour.precipitation_probability > 0 && (
                                    <span className="text-xs text-blue-400">
                                        {Math.round(item.hour.precipitation_probability)}%
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
