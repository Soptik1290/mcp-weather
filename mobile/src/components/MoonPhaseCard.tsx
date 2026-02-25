
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Ellipse, Defs, ClipPath, Rect } from 'react-native-svg';
import { t, Language, TimeFormat, formatTimeString } from '../utils';
import type { Astronomy } from '../types';

interface MoonPhaseCardProps {
    astronomy: Astronomy;
    textColor: string;
    subTextColor: string;
    cardBg: string;
    isDark: boolean;
    language: Language;
    timeFormat: TimeFormat;
}

/**
 * Renders a circular SVG moon with dynamic illumination based on moon_phase (0-1).
 *
 * Phase mapping:
 *   0.00 = New Moon (fully dark)
 *   0.25 = First Quarter (right half lit)
 *   0.50 = Full Moon (fully lit)
 *   0.75 = Last Quarter (left half lit)
 *   1.00 = New Moon (fully dark)
 */
function MoonSvg({ phase, size, isDark }: { phase: number; size: number; isDark: boolean }) {
    const r = size / 2 - 2; // radius with small padding
    const cx = size / 2;
    const cy = size / 2;

    // Moon surface colors
    const darkSide = isDark ? '#2a2a3a' : '#b0b0c0';
    const litSide = isDark ? '#e8e0d0' : '#f5f0e0';
    const craterColor = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)';

    // Normalize phase to [0, 1)
    const p = ((phase % 1) + 1) % 1;

    // Calculate the terminator ellipse rx
    // At 0 (new moon): fully dark -> overlay covers all
    // At 0.25 (first quarter): right half lit, left dark -> terminator at center
    // At 0.5 (full moon): fully lit -> no overlay
    // At 0.75 (last quarter): left half lit, right dark -> terminator at center
    //
    // We split into waxing (0-0.5) and waning (0.5-1) phases.
    // For waxing:  the lit part grows from right side
    // For waning:  the lit part shrinks from right side

    const isWaxing = p < 0.5;

    // terminator x-radius: goes from r (covering all) to 0 (straight line) to r (covering all)
    // Mapped: at p=0 rx=r, p=0.25 rx=0, p=0.5 rx=r, p=0.75 rx=0, p=1 rx=r
    const subPhase = isWaxing ? p * 2 : (p - 0.5) * 2; // 0..1 within half
    const terminatorRx = Math.abs(1 - subPhase * 2) * r;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <ClipPath id="moonClip">
                    <Circle cx={cx} cy={cy} r={r} />
                </ClipPath>
            </Defs>

            {/* Base: full lit circle */}
            <Circle cx={cx} cy={cy} r={r} fill={litSide} />

            {/* Craters for realism */}
            <Circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.12} fill={craterColor} clipPath="url(#moonClip)" />
            <Circle cx={cx + r * 0.2} cy={cy + r * 0.35} r={r * 0.09} fill={craterColor} clipPath="url(#moonClip)" />
            <Circle cx={cx + r * 0.4} cy={cy - r * 0.4} r={r * 0.07} fill={craterColor} clipPath="url(#moonClip)" />
            <Circle cx={cx - r * 0.1} cy={cy + r * 0.5} r={r * 0.06} fill={craterColor} clipPath="url(#moonClip)" />

            {/* Shadow overlay: covers the dark part of the moon */}
            {p !== 0.5 && (
                <>
                    {isWaxing ? (
                        // Waxing: dark side is on the left, shrinking
                        // At p=0 (new): cover everything (left rect full)
                        // At p=0.25 (first quarter): cover left half
                        // At p→0.5 (full): cover nothing
                        <>
                            {/* Left half always dark during waxing (until quarter) -- use terminator */}
                            <Rect
                                x={cx - r}
                                y={cy - r}
                                width={r}
                                height={r * 2}
                                fill={darkSide}
                                clipPath="url(#moonClip)"
                            />
                            {/* Terminator ellipse: if subPhase < 0.5, extends dark into right; if > 0.5, extends lit into left */}
                            <Ellipse
                                cx={cx}
                                cy={cy}
                                rx={terminatorRx}
                                ry={r}
                                fill={subPhase < 0.5 ? darkSide : litSide}
                                clipPath="url(#moonClip)"
                            />
                        </>
                    ) : (
                        // Waning: dark side is on the right, growing
                        <>
                            <Rect
                                x={cx}
                                y={cy - r}
                                width={r}
                                height={r * 2}
                                fill={darkSide}
                                clipPath="url(#moonClip)"
                            />
                            <Ellipse
                                cx={cx}
                                cy={cy}
                                rx={terminatorRx}
                                ry={r}
                                fill={subPhase < 0.5 ? litSide : darkSide}
                                clipPath="url(#moonClip)"
                            />
                        </>
                    )}
                </>
            )}

            {/* Subtle border ring */}
            <Circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} strokeWidth={1} />
        </Svg>
    );
}

/** Derive localized moon phase name from numeric value (0-1). */
function getPhaseNameFromValue(phase: number, language: string): string {
    const names: Record<string, string[]> = {
        en: ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'],
        cs: ['Nov', 'Dorůstající srpek', 'První čtvrť', 'Dorůstající měsíc', 'Úplněk', 'Couvající měsíc', 'Poslední čtvrť', 'Couvající srpek'],
    };
    const lang = names[language] ? language : 'en';
    const p = ((phase % 1) + 1) % 1;
    const idx = Math.round(p * 8) % 8;
    return names[lang][idx];
}

export function MoonPhaseCard({
    astronomy,
    textColor,
    subTextColor,
    cardBg,
    isDark,
    language = 'cs',
    timeFormat = '24h',
}: MoonPhaseCardProps) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const moonSize = isTablet ? 90 : 76;

    const phase = astronomy.moon_phase ?? 0;
    const illumination = astronomy.moon_illumination;
    const moonrise = astronomy.moonrise;
    const moonset = astronomy.moonset;
    const nextFull = astronomy.next_full_moon;

    // Derive phase name from value if not provided
    const phaseName = astronomy.moon_phase_name || getPhaseNameFromValue(phase, language);

    // Format ISO timestamp to HH:MM for display
    const formatISOToTime = (iso: string): string => {
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) {
                // Fallback: try extracting HH:MM from string
                const match = iso.match(/(\d{2}):(\d{2})/);
                return match ? `${match[1]}:${match[2]}` : iso;
            }
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            return `${hh}:${mm}`;
        } catch {
            return iso;
        }
    };

    // Format ISO date to readable date
    const formatISOToDate = (iso: string): string => {
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            return d.toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', {
                day: 'numeric',
                month: 'long',
            });
        } catch {
            return iso;
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: cardBg,
                    padding: isTablet ? 24 : 16,
                    borderRadius: isTablet ? 24 : 20,
                },
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={{ fontSize: 20 }}>🌙</Text>
                <Text style={[styles.title, { color: textColor }]}>
                    {t('moon_phase', language)}
                </Text>
            </View>

            {/* Main content: SVG + info */}
            <View style={styles.body}>
                {/* SVG Moon */}
                <View style={styles.moonContainer}>
                    <MoonSvg phase={phase} size={moonSize} isDark={isDark} />
                </View>

                {/* Info column */}
                <View style={styles.info}>
                    {/* Phase name */}
                    <Text style={[styles.phaseName, { color: textColor }]}>
                        {phaseName}
                    </Text>

                    {/* Illumination */}
                    {illumination != null && (
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {t('moon_illumination', language)}: {Math.round(illumination)}%
                        </Text>
                    )}

                    {/* Moonrise / Moonset */}
                    <View style={styles.timesRow}>
                        {moonrise && (
                            <View style={styles.timeItem}>
                                <Text style={{ fontSize: 14 }}>🌅</Text>
                                <Text style={[styles.timeLabel, { color: subTextColor }]}>
                                    {formatTimeString(formatISOToTime(moonrise), timeFormat)}
                                </Text>
                            </View>
                        )}
                        {moonset && (
                            <View style={styles.timeItem}>
                                <Text style={{ fontSize: 14 }}>🌇</Text>
                                <Text style={[styles.timeLabel, { color: subTextColor }]}>
                                    {formatTimeString(formatISOToTime(moonset), timeFormat)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Next full moon */}
            {nextFull && (
                <View style={styles.nextFull}>
                    <Text style={[styles.metaText, { color: subTextColor }]}>
                        {t('next_full_moon', language)}: {formatISOToDate(nextFull)}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    moonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: 4,
    },
    phaseName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    metaText: {
        fontSize: 13,
        lineHeight: 18,
    },
    timesRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
    },
    timeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeLabel: {
        fontSize: 13,
    },
    nextFull: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.3)',
    },
});

export default MoonPhaseCard;
