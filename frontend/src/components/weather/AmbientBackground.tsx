'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AmbientTheme, THEMES, getGradientStyle, isDarkTheme } from '@/lib/themes';

interface AmbientBackgroundProps {
    theme: AmbientTheme;
    children: React.ReactNode;
}

export function AmbientBackground({ theme, children }: AmbientBackgroundProps) {
    const [isLightning, setIsLightning] = useState(false);

    // Lightning effect for storm theme
    useEffect(() => {
        if (theme.effect !== 'lightning') return;

        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setIsLightning(true);
                setTimeout(() => setIsLightning(false), 100);

                // Double flash sometimes
                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        setIsLightning(true);
                        setTimeout(() => setIsLightning(false), 50);
                    }, 150);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [theme.effect]);

    const gradientStyle = getGradientStyle(theme);

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Gradient background */}
            <motion.div
                key={theme.theme}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 -z-10"
                style={{ background: gradientStyle }}
            />

            {/* Stars effect for clear night */}
            {theme.effect === 'stars' && <StarsEffect />}

            {/* Lightning flash overlay */}
            <AnimatePresence>
                {isLightning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.05 }}
                        className="absolute inset-0 bg-white -z-5 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

function StarsEffect() {
    const [stars] = useState(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 3,
        }))
    );

    return (
        <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: star.delay,
                    }}
                />
            ))}
        </div>
    );
}
