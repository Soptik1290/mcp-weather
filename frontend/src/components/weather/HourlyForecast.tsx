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

    // Get current hour to generate past hours
    const now = new Date();
    const currentHour = now.getHours();

    // Build timeline with past and future hours
    const hoursBeforeNow = 6;

    type TimelineItem = {
        time: Date;
        temperature: number;
        weather_code: number;
        precipitation_probability?: number;
        isNow: boolean;
        isPast: boolean;
    };

    const timeline: TimelineItem[] = [];

    // Past hours (estimated with current weather)
    for (let i = hoursBeforeNow; i > 0; i--) {
        const pastTime = new Date(now);
        pastTime.setHours(currentHour - i, 0, 0, 0);

        timeline.push({
            time: pastTime,
            temperature: forecast[0]?.temperature || 0,
            weather_code: forecast[0]?.weather_code || 0,
            isNow: false,
            isPast: true,
        });
    }

    // Current hour = "Now" with current weather data
    timeline.push({
        time: new Date(now.setMinutes(0, 0, 0)),
        temperature: forecast[0]?.temperature || 0,
        weather_code: forecast[0]?.weather_code || 0,
        precipitation_probability: forecast[0]?.precipitation_probability,
        isNow: true,
        isPast: false,
    });

    // Future hours from forecast data
    // The forecast array has future hours - use their proper times
    forecast.slice(1, 18).forEach((hour) => {
        timeline.push({
            time: new Date(hour.time),
            temperature: hour.temperature,
            weather_code: hour.weather_code,
            precipitation_probability: hour.precipitation_probability,
            isNow: false,
            isPast: false,
        });
    });

    // Auto-scroll to center on "Now"
    useEffect(() => {
        const timer = setTimeout(() => {
            if (nowRef.current && scrollRef.current) {
                const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                    const nowElement = nowRef.current;
                    const containerWidth = viewport.clientWidth;
                    const scrollPos = nowElement.offsetLeft - (containerWidth / 2) + (nowElement.clientWidth / 2);
                    viewport.scrollLeft = Math.max(0, scrollPos);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [forecast]);

    return (
        <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
            <h3 className={`text-sm font-medium ${subTextColor} mb-2`}>
                {t('hourly_forecast')}
            </h3>

            <ScrollArea className="w-full -mx-1" ref={scrollRef}>
                <div className="flex gap-1 pb-3 px-1">
                    {timeline.map((item, index) => {
                        const WeatherIcon = getWeatherIcon(item.weather_code);
                        const hourStr = item.isNow ? t('now') : formatTime(item.time);

                        return (
                            <motion.div
                                key={`hour-${index}`}
                                ref={item.isNow ? nowRef : undefined}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.015 }}
                                className={`
                                    flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-1 rounded-lg
                                    ${item.isNow ? (isDark ? 'bg-blue-500/20 border border-blue-400' : 'bg-blue-50 border border-blue-400') : ''}
                                    ${item.isPast ? 'opacity-40' : ''}
                                `}
                            >
                                <span className={`text-xs ${item.isNow ? (isDark ? 'text-blue-300 font-semibold' : 'text-blue-600 font-semibold') : subTextColor}`}>
                                    {hourStr}
                                </span>
                                <WeatherIcon className={`w-5 h-5 ${item.isPast ? subTextColor : textColor}`} />
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
                <ScrollBar orientation="horizontal" className="mt-0" />
            </ScrollArea>
        </Card>
    );
}
