'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { useSettings } from '@/lib/settings';

interface AuroraData {
    current_kp: number | null;
    current_description: string;
    visibility_probability: number;
    max_forecast_kp: number | null;
    max_visibility_probability: number;
    best_viewing_time: string | null;
    best_viewing_kp: number | null;
    forecast: Array<{
        time: string;
        kp: number;
        scale: string | null;
    }>;
    source: string;
    error?: string;
}

interface AuroraCardProps {
    data: AuroraData | null;
    isDark?: boolean;
    locationName?: string;
}

export function AuroraCard({ data, isDark = false, locationName }: AuroraCardProps) {
    const { t, formatTime } = useSettings();

    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';

    // Format best viewing time to local time string
    const formatBestTime = (utcTimeStr: string): string => {
        try {
            const date = new Date(utcTimeStr.replace(' ', 'T') + 'Z');
            return formatTime(date);
        } catch {
            return utcTimeStr;
        }
    };

    // Kp index color gradient (green -> yellow -> red -> purple)
    const getKpColor = (kp: number) => {
        if (kp < 3) return 'text-green-500';
        if (kp < 5) return 'text-yellow-500';
        if (kp < 7) return 'text-orange-500';
        if (kp < 8) return 'text-red-500';
        return 'text-purple-500';
    };

    const getKpBgColor = (kp: number) => {
        if (kp < 3) return 'bg-green-500/20';
        if (kp < 5) return 'bg-yellow-500/20';
        if (kp < 7) return 'bg-orange-500/20';
        if (kp < 8) return 'bg-red-500/20';
        return 'bg-purple-500/20';
    };

    // Get visibility text based on probability
    const getVisibilityText = (prob: number) => {
        if (prob === 0) return t('aurora_unlikely');
        if (prob < 25) return t('aurora_very_low');
        if (prob < 50) return t('aurora_low');
        if (prob < 75) return t('aurora_possible');
        return t('aurora_likely');
    };

    if (!data || data.error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
            >
                <Card className={`p-4 ${bgColor} backdrop-blur-md border-0`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className={`w-4 h-4 ${subTextColor}`} />
                        <span className={`text-sm ${subTextColor}`}>{t('aurora')}</span>
                    </div>
                    <p className={`text-sm ${subTextColor}`}>{t('aurora_unavailable')}</p>
                </Card>
            </motion.div>
        );
    }

    const currentKp = data.current_kp ?? 0;
    const visibilityProb = data.visibility_probability;
    const isStorm = currentKp >= 5;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="col-span-2"
        >
            <Card className={`p-4 ${bgColor} backdrop-blur-md border-0 overflow-hidden relative`}>
                {/* Aurora gradient background for active storms */}
                {isStorm && (
                    <div
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, #0c1445 0%, #1a5c3e 25%, #4a1c6d 50%, #0c1445 75%, #2d5a4a 100%)',
                            backgroundSize: '400% 400%',
                            animation: 'aurora-shift 8s ease-in-out infinite',
                        }}
                    />
                )}

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className={`w-4 h-4 ${isStorm ? 'text-purple-400' : subTextColor}`} />
                            <span className={`text-sm font-medium ${subTextColor}`}>{t('aurora')}</span>
                        </div>
                        {isStorm && (
                            <div className="flex items-center gap-1 text-xs text-purple-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{t('aurora_active')}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Current Kp */}
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${getKpColor(currentKp)}`}>
                                {currentKp.toFixed(1)}
                            </div>
                            <div className={`text-xs ${subTextColor} mt-1`}>Kp Index</div>
                            <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getKpBgColor(currentKp)} ${getKpColor(currentKp)}`}>
                                {data.current_description}
                            </div>
                        </div>

                        {/* Visibility for location */}
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${textColor}`}>
                                {visibilityProb}%
                            </div>
                            <div className={`text-xs ${subTextColor} mt-1`}>{t('aurora_visibility')}</div>
                            <div className={`text-xs ${subTextColor} flex items-center justify-center gap-1 mt-1`}>
                                <MapPin className="w-3 h-3" />
                                {locationName || 'Current location'}
                            </div>
                        </div>

                        {/* Max forecast */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <TrendingUp className={`w-4 h-4 ${subTextColor}`} />
                                <span className={`text-xl font-semibold ${getKpColor(data.max_forecast_kp ?? 0)}`}>
                                    {(data.max_forecast_kp ?? 0).toFixed(1)}
                                </span>
                            </div>
                            <div className={`text-xs ${subTextColor} mt-1`}>{t('aurora_max_24h')}</div>
                            <div className={`text-xs ${subTextColor} mt-1`}>
                                {t('aurora_max_visibility')}: {data.max_visibility_probability}%
                            </div>
                        </div>
                    </div>

                    {/* Best viewing time */}
                    {data.best_viewing_time && (
                        <div className={`mt-3 pt-3 border-t border-white/10 flex items-center gap-2 ${subTextColor}`}>
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">
                                {t('aurora_best_time')}: {formatBestTime(data.best_viewing_time)} (Kp {data.best_viewing_kp?.toFixed(1)})
                            </span>
                        </div>
                    )}

                    {/* Mini forecast chart */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                        <div className={`text-xs ${subTextColor} mb-2`}>{t('aurora_3day_forecast')}</div>
                        <div className="flex items-end gap-1 h-8">
                            {data.forecast.slice(0, 12).map((f, i) => {
                                const height = Math.max(10, (f.kp / 9) * 100);
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t ${getKpBgColor(f.kp)} min-w-[4px]`}
                                        style={{ height: `${height}%` }}
                                        title={`${f.time}: Kp ${f.kp}${f.scale ? ` (${f.scale})` : ''}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            {/* CSS for aurora animation */}
            <style jsx global>{`
                @keyframes aurora-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
        </motion.div>
    );
}
