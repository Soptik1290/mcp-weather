'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/settings';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onLocationDetected?: (lat: number, lon: number) => void;
    isLoading?: boolean;
    isDark?: boolean;
}

export function SearchBar({ onSearch, onLocationDetected, isLoading = false, isDark = false }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const { t } = useSettings();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            alert(t('geo_not_supported'));
            return;
        }

        setIsGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsGeoLoading(false);
                if (onLocationDetected) {
                    onLocationDetected(position.coords.latitude, position.coords.longitude);
                }
            },
            (error) => {
                setIsGeoLoading(false);
                console.error('Geolocation error:', error);
                alert(t('geo_error'));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const bgColor = isDark ? 'bg-white/10' : 'bg-white/60';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const placeholderColor = isDark ? 'placeholder:text-white/50' : 'placeholder:text-gray-400';

    return (
        <form onSubmit={handleSubmit} className="relative">
            <motion.div
                animate={{
                    scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
            >
                <div className={`flex items-center gap-2 ${bgColor} backdrop-blur-md rounded-full px-4 py-2`}>
                    <Search className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
                    <Input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading || isGeoLoading}
                        className={`border-0 bg-transparent ${textColor} ${placeholderColor} focus-visible:ring-0 focus-visible:ring-offset-0`}
                    />
                    {/* Geolocation button */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleGeolocation}
                        disabled={isLoading || isGeoLoading}
                        className={`rounded-full h-8 w-8 ${isDark ? 'text-white/70 hover:bg-white/10' : 'text-gray-500 hover:bg-black/5'}`}
                        title={t('use_my_location')}
                    >
                        {isGeoLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4" />
                        )}
                    </Button>
                    {isLoading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className={`w-5 h-5 border-2 border-t-transparent rounded-full ${isDark ? 'border-white/50' : 'border-gray-400'
                                }`}
                        />
                    )}
                </div>
            </motion.div>
        </form>
    );
}

interface HamburgerMenuProps {
    isDark?: boolean;
    onOpenMenu?: () => void;
}

export function HamburgerMenu({ isDark = false, onOpenMenu }: HamburgerMenuProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMenu}
            className={`rounded-full ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-black/5'}`}
        >
            <Menu className="w-6 h-6" />
        </Button>
    );
}
