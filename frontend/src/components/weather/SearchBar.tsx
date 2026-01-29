'use client';

import { useState, useEffect, useRef } from 'react';
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
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const wrapperRef = useRef<HTMLFormElement>(null);
    const { t, language } = useSettings();

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2 && isFocused) {
                setIsSearching(true);
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query, language })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(data.length > 0);
                    }
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearching(false);
                }
            } else if (query.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isFocused, language]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleSuggestionClick = (suggestion: any) => {
        setQuery(suggestion.name);
        setShowSuggestions(false);
        if (onLocationDetected) {
            onLocationDetected(suggestion.latitude, suggestion.longitude);
        } else {
            onSearch(suggestion.name);
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
    const dropdownBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const itemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100';
    const secondaryText = isDark ? 'text-gray-400' : 'text-gray-500';

    return (
        <form onSubmit={handleSubmit} className="relative" ref={wrapperRef}>
            <motion.div
                animate={{
                    scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
            >
                <div className={`flex items-center gap-2 ${bgColor} backdrop-blur-md rounded-full px-4 py-2 relative z-50`}>
                    <Search className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
                    <Input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            setIsFocused(true);
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                            // Delayed hide to allow clicking suggestions
                            // setTimeout(() => setIsFocused(false), 200); 
                            // Removing onBlur hide, rely on clickOutside
                        }}
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
                        {isGeoLoading || isSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 5 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-40 ${dropdownBg}`}
                    >
                        <ul className="max-h-60 overflow-auto py-2">
                            {suggestions.map((item, index) => (
                                <li key={`${item.latitude}-${item.longitude}-${index}`}>
                                    <button
                                        type="button"
                                        onClick={() => handleSuggestionClick(item)}
                                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${itemHover}`}
                                    >
                                        <div>
                                            <span className={`font-medium ${textColor}`}>{item.name}</span>
                                            <span className={`ml-2 text-xs ${secondaryText}`}>
                                                {item.country && `${item.country}`}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
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
