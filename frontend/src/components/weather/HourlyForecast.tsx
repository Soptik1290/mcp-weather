'use client';

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
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    return (
        <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
            <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                {t('hourly_forecast')}
            </h3>

            <ScrollArea className="w-full">
                <div className="flex gap-4 pb-2">
                    {forecast.slice(0, 24).map((hour, index) => {
                        const WeatherIcon = getWeatherIcon(hour.weather_code);
                        const time = new Date(hour.time);
                        const hourStr = index === 0 ? t('now') : formatTime(time);

                        return (
                            <motion.div
                                key={hour.time}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex flex-col items-center gap-1 min-w-[60px]"
                            >
                                <span className={`text-xs ${subTextColor}`}>{hourStr}</span>
                                <WeatherIcon className={`w-6 h-6 ${textColor}`} />
                                <span className={`text-sm font-medium ${textColor}`}>
                                    {formatTemperature(hour.temperature)}
                                </span>
                                {hour.precipitation_probability !== undefined && hour.precipitation_probability > 0 && (
                                    <span className="text-xs text-blue-400">
                                        {Math.round(hour.precipitation_probability)}%
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
