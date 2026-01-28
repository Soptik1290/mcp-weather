'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-icons';
import { DailyForecast, HourlyForecast } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/lib/settings';
import { WeatherDetailModal } from './WeatherDetailModal';
import { WeatherChart } from './WeatherChart';
import { Wind, Droplets, CloudRain, Sun } from 'lucide-react';

interface ForecastCardProps {
    forecast: DailyForecast[];
    hourlyForecast?: HourlyForecast[];
    isDark?: boolean;
}

export function DailyForecastCard({ forecast, hourlyForecast, isDark = false }: ForecastCardProps) {
    const { t, temperatureUnit, getDayName, getWeatherDescription, formatTemperature } = useSettings();
    const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const formatTemp = (celsius: number) => {
        if (temperatureUnit === 'fahrenheit') {
            return `${Math.round((celsius * 9 / 5) + 32)}°`;
        }
        return `${Math.round(celsius)}°`;
    };

    // Get hourly data for selected day
    const getHourlyForDay = (date: string) => {
        if (!hourlyForecast) return [];
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return hourlyForecast.filter(hour => {
            const hourTime = new Date(hour.time);
            return hourTime >= dayStart && hourTime <= dayEnd;
        });
    };

    // Prepare chart data for selected day
    const selectedDayHourly = selectedDay ? getHourlyForDay(selectedDay.date) : [];
    const tempChartData = selectedDayHourly.map((hour, i) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: hour.temperature,
        highlight: false,
    }));

    return (
        <>
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
                <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                    {t('daily_forecast')}
                </h3>

                <div className="space-y-2">
                    {forecast.slice(0, 7).map((day, index) => {
                        const WeatherIcon = getWeatherIcon(day.weather_code);
                        const date = new Date(day.date);
                        const dayName = index === 0 ? t('today') : getDayName(date);
                        const weatherDesc = getWeatherDescription(day.weather_code);

                        return (
                            <motion.div
                                key={day.date}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedDay(day)}
                                className={`flex items-center justify-between py-2 cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-white/10 ${index < forecast.length - 1 ? 'border-b border-white/10' : ''}`}
                            >
                                <span className={`w-12 text-sm ${textColor}`}>{dayName}</span>

                                <div className="flex items-center gap-2 flex-1 justify-center">
                                    <WeatherIcon className={`w-5 h-5 ${subTextColor}`} />
                                    <span className={`text-xs ${subTextColor}`}>
                                        {weatherDesc.split(' ').slice(0, 2).join(' ')}
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

            {/* Day Detail Modal */}
            <WeatherDetailModal
                open={selectedDay !== null}
                onOpenChange={(open) => !open && setSelectedDay(null)}
                title={selectedDay ? getDayName(new Date(selectedDay.date)) : ''}
                subtitle={selectedDay ? getWeatherDescription(selectedDay.weather_code) : ''}
                isDark={isDark}
            >
                {selectedDay && (
                    <div className="space-y-4">
                        {/* Temperature Range */}
                        <div className={`flex justify-center gap-8 py-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className="text-center">
                                <p className={`text-xs ${subTextColor}`}>{t('temp_high')}</p>
                                <p className={`text-2xl font-semibold ${textColor}`}>
                                    {formatTemp(selectedDay.temperature_max)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className={`text-xs ${subTextColor}`}>{t('temp_low')}</p>
                                <p className={`text-2xl font-semibold ${subTextColor}`}>
                                    {formatTemp(selectedDay.temperature_min)}
                                </p>
                            </div>
                        </div>

                        {/* Hourly Temperature Chart */}
                        {tempChartData.length > 0 && (
                            <div>
                                <p className={`text-sm ${subTextColor} mb-2`}>{t('hourly_temperature')}</p>
                                <WeatherChart
                                    data={tempChartData}
                                    height={120}
                                    color="#f97316"
                                    unit="°"
                                    isDark={isDark}
                                    showArea={true}
                                />
                            </div>
                        )}

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-3">
                            {selectedDay.precipitation_probability !== undefined && (
                                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-2`}>
                                    <CloudRain className={`w-4 h-4 ${subTextColor}`} />
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('rain')}</p>
                                        <p className={`text-sm font-medium ${textColor}`}>
                                            {Math.round(selectedDay.precipitation_probability)}%
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selectedDay.wind_speed_max !== undefined && (
                                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-2`}>
                                    <Wind className={`w-4 h-4 ${subTextColor}`} />
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('wind')}</p>
                                        <p className={`text-sm font-medium ${textColor}`}>
                                            {Math.round(selectedDay.wind_speed_max)} km/h
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selectedDay.uv_index_max !== undefined && (
                                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-2`}>
                                    <Sun className={`w-4 h-4 ${subTextColor}`} />
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('uv_index')}</p>
                                        <p className={`text-sm font-medium ${textColor}`}>
                                            {selectedDay.uv_index_max.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </WeatherDetailModal>
        </>
    );
}
