'use client';

import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-icons';
import { DailyForecast } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/lib/settings';

interface ForecastCardProps {
    forecast: DailyForecast[];
    isDark?: boolean;
}

export function DailyForecastCard({ forecast, isDark = false }: ForecastCardProps) {
    const { formatTemperature, t, temperatureUnit } = useSettings();
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    // Simple temperature display for compact format
    const formatTemp = (celsius: number) => {
        if (temperatureUnit === 'fahrenheit') {
            return `${Math.round((celsius * 9 / 5) + 32)}°`;
        }
        return `${Math.round(celsius)}°`;
    };

    return (
        <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
            <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                {t('daily_forecast')}
            </h3>

            <div className="space-y-2">
                {forecast.slice(0, 7).map((day, index) => {
                    const WeatherIcon = getWeatherIcon(day.weather_code);
                    const date = new Date(day.date);
                    const dayName = index === 0 ? t('today') : date.toLocaleDateString('en-US', { weekday: 'short' });

                    return (
                        <motion.div
                            key={day.date}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center justify-between py-2 ${index < forecast.length - 1 ? 'border-b border-white/10' : ''
                                }`}
                        >
                            <span className={`w-12 text-sm ${textColor}`}>{dayName}</span>

                            <div className="flex items-center gap-2 flex-1 justify-center">
                                <WeatherIcon className={`w-5 h-5 ${subTextColor}`} />
                                <span className={`text-xs ${subTextColor}`}>
                                    {day.weather_description?.split(' ').slice(0, 2).join(' ')}
                                </span>
                            </div>

                            <div className={`flex gap-2 text-sm ${textColor}`}>
                                <span className="font-medium">{formatTemp(day.temperature_max)}</span>
                                <span className={subTextColor}>{formatTemp(day.temperature_min)}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
}
