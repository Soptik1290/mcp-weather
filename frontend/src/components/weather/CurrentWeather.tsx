'use client';

import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-icons';
import { CurrentWeather as CurrentWeatherType, Astronomy } from '@/lib/types';
import { Droplets, Wind, Eye, Gauge } from 'lucide-react';

interface CurrentWeatherProps {
    current: CurrentWeatherType;
    locationName: string;
    astronomy?: Astronomy | null;
    aiSummary?: string;
    isDark?: boolean;
}

export function CurrentWeatherCard({
    current,
    locationName,
    astronomy,
    aiSummary,
    isDark = false,
}: CurrentWeatherProps) {
    const WeatherIcon = getWeatherIcon(current.weather_code);
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/80' : 'text-gray-600';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col justify-between p-8"
        >
            {/* Location */}
            <div>
                <motion.h1
                    className={`text-4xl font-bold ${textColor}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {locationName}
                </motion.h1>

                {/* Current conditions */}
                <p className={`text-lg ${subTextColor} mt-1`}>
                    {current.weather_description || 'Unknown'}
                </p>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-6 my-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                >
                    <WeatherIcon className={`w-24 h-24 ${textColor}`} strokeWidth={1.5} />
                </motion.div>

                <div>
                    <motion.div
                        className={`text-8xl font-light ${textColor}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {Math.round(current.temperature)}°
                    </motion.div>

                    {current.feels_like !== undefined && (
                        <p className={`text-lg ${subTextColor}`}>
                            Feels like {Math.round(current.feels_like)}°
                        </p>
                    )}
                </div>
            </div>

            {/* Quick stats */}
            <div className={`grid grid-cols-2 gap-4 ${subTextColor}`}>
                {current.humidity !== undefined && (
                    <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5" />
                        <span>{current.humidity}%</span>
                    </div>
                )}

                {current.wind_speed !== undefined && (
                    <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5" />
                        <span>{Math.round(current.wind_speed)} km/h</span>
                    </div>
                )}

                {current.visibility !== undefined && (
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        <span>{current.visibility} km</span>
                    </div>
                )}

                {current.pressure !== undefined && (
                    <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5" />
                        <span>{current.pressure} hPa</span>
                    </div>
                )}
            </div>

            {/* AI Summary */}
            {aiSummary && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={`mt-6 p-4 rounded-xl backdrop-blur-sm ${isDark ? 'bg-white/10' : 'bg-black/5'
                        }`}
                >
                    <p className={`text-sm ${subTextColor} flex items-start gap-2`}>
                        <span className="text-lg">🤖</span>
                        <span>{aiSummary}</span>
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
