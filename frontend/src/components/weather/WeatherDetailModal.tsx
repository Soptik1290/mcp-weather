'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface WeatherDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    isDark?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function WeatherDetailModal({
    open,
    onOpenChange,
    title,
    subtitle,
    children,
    isDark = false,
    size = 'md',
}: WeatherDetailModalProps) {
    const bgColor = isDark ? 'bg-gray-900/95' : 'bg-white/95';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-white/70' : 'text-gray-500';

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`${bgColor} backdrop-blur-xl border-0 ${sizeClasses[size]} w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`}
            >
                <DialogHeader className="pb-2">
                    <DialogTitle className={`text-xl font-semibold ${textColor}`}>
                        {title}
                    </DialogTitle>
                    {subtitle && (
                        <p className={`text-sm ${subTextColor}`}>{subtitle}</p>
                    )}
                </DialogHeader>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {children}
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
