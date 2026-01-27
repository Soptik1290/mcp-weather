'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Thermometer, Info, Github, Settings, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/lib/settings';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isDark?: boolean;
}

export function SideMenu({
    isOpen,
    onClose,
    isDark = false,
}: SideMenuProps) {
    const { language, setLanguage, temperatureUnit, setTemperatureUnit, timeFormat, setTimeFormat, auroraDisplay, setAuroraDisplay, t } = useSettings();

    const bgColor = isDark ? 'bg-gray-900/95' : 'bg-white/95';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
    const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed left-0 top-0 bottom-0 w-80 ${bgColor} backdrop-blur-md z-50 shadow-2xl flex flex-col`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
                            <div className="flex items-center gap-2">
                                <Settings className={`w-5 h-5 ${textColor}`} />
                                <h2 className={`text-lg font-semibold ${textColor}`}>{t('settings')}</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className={isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-black/5'}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Settings Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Language Setting */}
                            <SettingSection
                                icon={Globe}
                                title={t('language')}
                                subtitle={t('choose_language')}
                                isDark={isDark}
                            >
                                <div className="flex gap-2 mt-3">
                                    <ToggleButton
                                        active={language === 'en'}
                                        onClick={() => setLanguage('en')}
                                        isDark={isDark}
                                    >
                                        🇬🇧 English
                                    </ToggleButton>
                                    <ToggleButton
                                        active={language === 'cs'}
                                        onClick={() => setLanguage('cs')}
                                        isDark={isDark}
                                    >
                                        🇨🇿 Čeština
                                    </ToggleButton>
                                </div>
                            </SettingSection>

                            {/* Temperature Unit */}
                            <SettingSection
                                icon={Thermometer}
                                title={t('temperature')}
                                subtitle={t('select_unit')}
                                isDark={isDark}
                            >
                                <div className="flex gap-2 mt-3">
                                    <ToggleButton
                                        active={temperatureUnit === 'celsius'}
                                        onClick={() => setTemperatureUnit('celsius')}
                                        isDark={isDark}
                                    >
                                        °C Celsius
                                    </ToggleButton>
                                    <ToggleButton
                                        active={temperatureUnit === 'fahrenheit'}
                                        onClick={() => setTemperatureUnit('fahrenheit')}
                                        isDark={isDark}
                                    >
                                        °F Fahrenheit
                                    </ToggleButton>
                                </div>
                            </SettingSection>

                            {/* Time Format */}
                            <SettingSection
                                icon={Clock}
                                title={t('time_format')}
                                subtitle={t('select_time_format')}
                                isDark={isDark}
                            >
                                <div className="flex gap-2 mt-3">
                                    <ToggleButton
                                        active={timeFormat === '24h'}
                                        onClick={() => setTimeFormat('24h')}
                                        isDark={isDark}
                                    >
                                        24h
                                    </ToggleButton>
                                    <ToggleButton
                                        active={timeFormat === '12h'}
                                        onClick={() => setTimeFormat('12h')}
                                        isDark={isDark}
                                    >
                                        12h AM/PM
                                    </ToggleButton>
                                </div>
                            </SettingSection>

                            {/* Aurora Display */}
                            <SettingSection
                                icon={Sparkles}
                                title={t('aurora_setting')}
                                subtitle={t('aurora_setting_desc')}
                                isDark={isDark}
                            >
                                <div className="flex flex-col gap-2 mt-3">
                                    <ToggleButton
                                        active={auroraDisplay === 'auto'}
                                        onClick={() => setAuroraDisplay('auto')}
                                        isDark={isDark}
                                    >
                                        {t('aurora_auto')}
                                    </ToggleButton>
                                    <ToggleButton
                                        active={auroraDisplay === 'always'}
                                        onClick={() => setAuroraDisplay('always')}
                                        isDark={isDark}
                                    >
                                        {t('aurora_always')}
                                    </ToggleButton>
                                    <ToggleButton
                                        active={auroraDisplay === 'never'}
                                        onClick={() => setAuroraDisplay('never')}
                                        isDark={isDark}
                                    >
                                        {t('aurora_never')}
                                    </ToggleButton>
                                </div>
                            </SettingSection>

                            {/* About Section */}
                            <SettingSection
                                icon={Info}
                                title={t('about')}
                                subtitle={t('about_desc')}
                                isDark={isDark}
                            >
                                <div className={`mt-3 text-sm ${subTextColor}`}>
                                    <p className="mb-2">
                                        {t('about_text')}
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Open-Meteo</li>
                                        <li>OpenWeatherMap</li>
                                        <li>WeatherAPI.com</li>
                                        <li>Visual Crossing</li>
                                    </ul>
                                </div>
                            </SettingSection>
                        </div>

                        {/* Footer */}
                        <div className={`p-4 border-t ${borderColor}`}>
                            <a
                                href="https://github.com/Soptik1290/mcp-weather"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-gray-900'
                                    }`}
                            >
                                <Github className="w-5 h-5" />
                                <span className="text-sm font-medium">{t('view_github')}</span>
                            </a>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Setting Section Component
function SettingSection({
    icon: Icon,
    title,
    subtitle,
    isDark,
    children,
}: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    isDark?: boolean;
    children: React.ReactNode;
}) {
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
    const bgColor = isDark ? 'bg-white/5' : 'bg-gray-50';

    return (
        <Card className={`p-4 ${bgColor} border-0`}>
            <div className="flex items-center gap-3 mb-1">
                <Icon className={`w-4 h-4 ${subTextColor}`} />
                <div>
                    <h3 className={`font-medium ${textColor}`}>{title}</h3>
                    <p className={`text-xs ${subTextColor}`}>{subtitle}</p>
                </div>
            </div>
            {children}
        </Card>
    );
}

// Toggle Button Component
function ToggleButton({
    active,
    onClick,
    isDark,
    children,
}: {
    active: boolean;
    onClick: () => void;
    isDark?: boolean;
    children: React.ReactNode;
}) {
    const baseStyle = 'px-3 py-2 rounded-lg text-sm font-medium transition-all';
    const activeStyle = isDark
        ? 'bg-blue-500 text-white'
        : 'bg-blue-500 text-white';
    const inactiveStyle = isDark
        ? 'bg-white/10 text-gray-300 hover:bg-white/20'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300';

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}
        >
            {children}
        </button>
    );
}
