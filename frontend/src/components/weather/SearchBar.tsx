'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
    isDark?: boolean;
}

export function SearchBar({ onSearch, isLoading = false, isDark = false }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
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
                        placeholder="Search city..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading}
                        className={`border-0 bg-transparent ${textColor} ${placeholderColor} focus-visible:ring-0 focus-visible:ring-offset-0`}
                    />
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
