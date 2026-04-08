'use client';

import { SettingsProvider } from '@/lib/settings';
import * as Sentry from "@sentry/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SettingsProvider>
            <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
                {children}
            </Sentry.ErrorBoundary>
        </SettingsProvider>
    );
}
