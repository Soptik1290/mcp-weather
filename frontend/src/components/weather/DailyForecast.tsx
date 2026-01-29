'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-icons';
import { DailyForecast, HourlyForecast } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/lib/settings';
import { WeatherDetailModal } from './WeatherDetailModal';
import { WeatherChart } from './WeatherChart';
import { Wind, Droplets, CloudRain, Sun, Sunrise, Sunset, Thermometer, ChevronRight } from 'lucide-react';

interface ForecastCardProps {
    forecast: DailyForecast[];
    hourlyForecast?: HourlyForecast[];
    isDark?: boolean;
}

export function DailyForecastCard({ forecast, hourlyForecast, isDark = false }: ForecastCardProps) {
    const { t, temperatureUnit, getDayName, getWeatherDescription } = useSettings();
    const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    const formatTemp = (celsius: number) => {
        if (temperatureUnit === 'fahrenheit') {
            return `${Math.round((celsius * 9 / 5) + 32)}°`;
        }
        return `${Math.round(celsius)}°`;
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '--:--';
        const date = new Date(timeString);
        return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
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
    const tempChartData = selectedDayHourly.map((hour) => ({
        label: new Date(hour.time).getHours().toString().padStart(2, '0'),
        value: hour.temperature,
        highlight: false,
    }));

    // Prepare rain probability chart data
    const rainChartData = selectedDayHourly
        .filter(hour => hour.precipitation_probability !== undefined)
        .map((hour) => ({
            label: new Date(hour.time).getHours().toString().padStart(2, '0'),
            value: hour.precipitation_probability || 0,
            highlight: false,
        }));

    const handleDayClick = (day: DailyForecast, index: number) => {
        setSelectedDay(day);
        setSelectedDayIndex(index);
    };

    const selectedDayName = selectedDay
        ? (selectedDayIndex === 0 ? t('today') : getDayName(new Date(selectedDay.date)))
        : '';

    const selectedFullDate = selectedDay
        ? new Date(selectedDay.date).toLocaleDateString('cs-CZ', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
        : '';

    return (
        <>
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
                <h3 className={`text-sm font-medium ${subTextColor} mb-3`}>
                    {t('daily_forecast')}
                </h3>

                <div className="space-y-1">
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
                                onClick={() => handleDayClick(day, index)}
                                className={`
                                    group flex items-center justify-between py-3 px-3 -mx-3
                                    cursor-pointer rounded-xl
                                    transition-all duration-200 ease-out
                                    hover:bg-gradient-to-r 
                                    ${isDark
                                        ? 'hover:from-white/10 hover:to-white/5 hover:shadow-lg hover:shadow-white/5'
                                        : 'hover:from-blue-50 hover:to-transparent hover:shadow-md hover:shadow-blue-100/50'
                                    }
                                    hover:scale-[1.02] hover:-translate-y-0.5
                                    active:scale-[0.99]
                                    ${index < forecast.length - 1 ? 'border-b border-white/5' : ''}
                                `}
                            >
                                <span className={`w-14 text-sm font-medium ${textColor} group-hover:font-semibold transition-all`}>
                                    {dayName}
                                </span>

                                <div className="flex items-center gap-2 flex-1 justify-center">
                                    <WeatherIcon className={`w-5 h-5 ${subTextColor} group-hover:scale-110 transition-transform`} />
                                    <span className={`text-xs ${subTextColor}`}>
                                        {weatherDesc.split(' ').slice(0, 2).join(' ')}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-2 text-sm ${textColor}`}>
                                    <span className="font-semibold">{formatTemp(day.temperature_max)}</span>
                                    <span className={subTextColor}>{formatTemp(day.temperature_min)}</span>
                                    <ChevronRight className={`w-4 h-4 ${subTextColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
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
                title={selectedDayName}
                subtitle={selectedFullDate}
                isDark={isDark}
                size="xl"
            >
                {selectedDay && (
                    <div className="space-y-5">
                        {/* Weather Icon and Description */}
                        <div className="flex items-center justify-center gap-4 py-2">
                            {(() => {
                                const Icon = getWeatherIcon(selectedDay.weather_code);
                                return <Icon className={`w-12 h-12 ${isDark ? 'text-white/80' : 'text-gray-600'}`} />;
                            })()}
                            <div className="text-center">
                                <p className={`text-lg font-medium ${textColor}`}>
                                    {getWeatherDescription(selectedDay.weather_code)}
                                </p>
                            </div>
                        </div>

                        {/* Temperature Range - Larger */}
                        <div className={`flex justify-center gap-12 py-5 rounded-xl ${isDark ? 'bg-gradient-to-r from-orange-500/10 to-blue-500/10' : 'bg-gradient-to-r from-orange-50 to-blue-50'}`}>
                            <div className="text-center">
                                <div className="flex items-center gap-1 justify-center mb-1">
                                    <Thermometer className="w-4 h-4 text-orange-500" />
                                    <p className={`text-xs ${subTextColor}`}>{t('temp_high')}</p>
                                </div>
                                <p className="text-3xl font-bold text-orange-500">
                                    {formatTemp(selectedDay.temperature_max)}
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center gap-1 justify-center mb-1">
                                    <Thermometer className="w-4 h-4 text-blue-500" />
                                    <p className={`text-xs ${subTextColor}`}>{t('temp_low')}</p>
                                </div>
                                <p className="text-3xl font-bold text-blue-500">
                                    {formatTemp(selectedDay.temperature_min)}
                                </p>
                            </div>
                        </div>

                        {/* Sunrise/Sunset */}
                        {(selectedDay.sunrise || selectedDay.sunset) && (
                            <div className={`flex justify-around py-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                {selectedDay.sunrise && (
                                    <div className="flex items-center gap-2">
                                        <Sunrise className="w-5 h-5 text-amber-500" />
                                        <div>
                                            <p className={`text-xs ${subTextColor}`}>{t('sunrise')}</p>
                                            <p className={`text-sm font-medium ${textColor}`}>
                                                {formatTime(selectedDay.sunrise)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedDay.sunset && (
                                    <div className="flex items-center gap-2">
                                        <Sunset className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <p className={`text-xs ${subTextColor}`}>{t('sunset')}</p>
                                            <p className={`text-sm font-medium ${textColor}`}>
                                                {formatTime(selectedDay.sunset)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Charts Section */}
                        {(tempChartData.length > 0 || rainChartData.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Hourly Temperature Chart */}
                                {tempChartData.length > 0 && (
                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <p className={`text-sm font-medium ${subTextColor} mb-2`}>{t('hourly_temperature')}</p>
                                        <WeatherChart
                                            data={tempChartData}
                                            height={180}
                                            color="#f97316"
                                            unit="°"
                                            isDark={isDark}
                                            showArea={true}
                                        />
                                    </div>
                                )}

                                {/* Hourly Rain Probability Chart */}
                                {rainChartData.length > 0 && (
                                    <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <p className={`text-sm font-medium ${subTextColor} mb-2`}>{t('precipitation_probability')}</p>
                                        <WeatherChart
                                            data={rainChartData}
                                            height={180}
                                            color="#3b82f6"
                                            unit="%"
                                            isDark={isDark}
                                            showArea={true}
                                            minValue={0}
                                            maxValue={100}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Weather Details Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Rain Probability */}
                            {selectedDay.precipitation_probability !== undefined && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-3`}>
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                        <CloudRain className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('rain')}</p>
                                        <p className={`text-lg font-semibold ${textColor}`}>
                                            {Math.round(selectedDay.precipitation_probability)}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Precipitation Amount */}
                            {selectedDay.precipitation_sum !== undefined && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-3`}>
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                                        <Droplets className="w-5 h-5 text-cyan-500" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('precipitation')}</p>
                                        <p className={`text-lg font-semibold ${textColor}`}>
                                            {selectedDay.precipitation_sum.toFixed(1)} mm
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Wind Speed */}
                            {selectedDay.wind_speed_max !== undefined && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-3`}>
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-500/20' : 'bg-gray-100'}`}>
                                        <Wind className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('wind')}</p>
                                        <p className={`text-lg font-semibold ${textColor}`}>
                                            {Math.round(selectedDay.wind_speed_max)} km/h
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* UV Index */}
                            {selectedDay.uv_index_max !== undefined && (
                                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center gap-3`}>
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                                        <Sun className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>{t('uv_index')}</p>
                                        <p className={`text-lg font-semibold ${textColor}`}>
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
