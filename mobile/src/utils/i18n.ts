/**
 * Internationalization (i18n) module for the mobile app.
 * Ported from frontend/src/lib/settings.tsx to match PC version.
 */

type Language = 'en' | 'cs';
type TimeFormat = '24h' | '12h';

// Day names
const dayNames: Record<Language, { short: string[]; long: string[] }> = {
    en: {
        short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    cs: {
        short: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
        long: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'],
    },
};

// Full translations dictionary
const translations: Record<Language, Record<string, string>> = {
    en: {
        // Weather cards
        'wind': 'Wind',
        'humidity': 'Humidity',
        'uv_index': 'UV Index',
        'rain': 'Rain',
        'snow': 'Snow',
        'mixed_precip': 'Mixed precipitation',
        'sunrise': 'Sunrise',
        'sunset': 'Sunset',
        'feels_like': 'Feels like',
        'now': 'Now',
        'expected': 'Expected',

        // WMO Weather Codes
        'wmo_0': 'Clear sky',
        'wmo_1': 'Mainly clear',
        'wmo_2': 'Partly cloudy',
        'wmo_3': 'Overcast',
        'wmo_45': 'Fog',
        'wmo_48': 'Depositing rime fog',
        'wmo_51': 'Light drizzle',
        'wmo_53': 'Moderate drizzle',
        'wmo_55': 'Dense drizzle',
        'wmo_56': 'Light freezing drizzle',
        'wmo_57': 'Dense freezing drizzle',
        'wmo_61': 'Slight rain',
        'wmo_63': 'Moderate rain',
        'wmo_65': 'Heavy rain',
        'wmo_66': 'Light freezing rain',
        'wmo_67': 'Heavy freezing rain',
        'wmo_71': 'Slight snow fall',
        'wmo_73': 'Moderate snow fall',
        'wmo_75': 'Heavy snow fall',
        'wmo_77': 'Snow grains',
        'wmo_80': 'Slight rain showers',
        'wmo_81': 'Moderate rain showers',
        'wmo_82': 'Violent rain showers',
        'wmo_85': 'Slight snow showers',
        'wmo_86': 'Heavy snow showers',
        'wmo_95': 'Thunderstorm',
        'wmo_96': 'Thunderstorm with slight hail',
        'wmo_99': 'Thunderstorm with heavy hail',

        // Humidity levels
        'dry': 'Dry',
        'comfortable': 'Comfortable',
        'humid': 'Humid',
        'very_humid': 'Very humid',

        // UV levels
        'low': 'Low',
        'moderate': 'Moderate',
        'high': 'High',
        'very_high': 'Very High',
        'extreme': 'Extreme',

        // Forecast
        'hourly_forecast': 'Hourly Forecast',
        'daily_forecast': '7-Day Forecast',
        'today': 'Today',
        'day': 'day',
        'days': 'days',

        // Search
        'search_city': 'Search city...',
        'use_my_location': 'Use my location',
        'detecting_location': 'Detecting your location...',
        'search_title': 'Search Location',
        'search_results': 'Search Results',
        'search_error': 'Failed to search location',
        'searching': 'Searching...',
        'no_results': 'No results for',
        'try_another_city': 'Try another city name',
        'auto_detect': 'Automatically detect city',

        // Menu / Settings
        'settings': 'Settings',
        'language': 'Language',
        'choose_language': 'Choose your preferred language',
        'temperature': 'Temperature',
        'select_unit': 'Select temperature unit',
        'astro_pack': 'AstroPack',
        'iss_location': 'ISS Location',
        'active_showers': 'Active Meteor Showers',
        'no_showers': 'No active meteor showers',
        'next_pass': 'Next pass',
        'calculating': 'calculating...',
        'peak': 'Peak',
        'zhr': 'ZHR',
        'about': 'About',
        'about_desc': 'Weather AI Aggregator',
        'about_text': 'AI-powered weather aggregation from 4 sources with intelligent deduction.',
        'view_github': 'View on GitHub',
        'general': 'GENERAL',
        'notifications_section': 'NOTIFICATIONS',
        'ai_section': 'AI FORECAST',
        'about_section': 'ABOUT',
        'language_desc': 'App and forecast language',
        'temp_desc': 'Temperature display units',
        'time_format_desc': 'Select time format',
        'notifications_desc': 'Push weather notifications',
        'aurora_alerts_desc': 'Aurora borealis alerts',
        'haptic_desc': 'Haptic feedback on interactions',
        'confidence_desc': 'How optimistic AI will be',
        'vibration': 'Vibration',
        'notifications': 'Notifications',
        'forecast_style': 'Forecast style',
        'cautious': '🛡️ Cautious',
        'balanced': '⚖️ Balanced',
        'optimistic': '🌟 Optimistic',

        // AI Summary
        'ai_forecast': 'AI-powered forecast',
        'ai_summary': 'AI Summary',
        'confidence': 'Confidence',
        'aggregated_from': 'Aggregated from',
        'sources': 'sources',
        'reliability': 'Reliability',
        'widget_preview': 'Preview',
        'widget_theme': 'Theme',
        'widget_background_color': 'Background Color',
        'widget_opacity': 'Opacity',
        'widget_save': 'Save Settings',
        'theme_option_auto': 'AUTO',
        'theme_option_light': 'LIGHT',
        'theme_option_dark': 'DARK',
        'theme_option_custom': 'CUSTOM',

        // Aurora
        'aurora': 'Aurora Borealis',
        'aurora_section': 'AURORA',
        'aurora_visibility': 'Visibility',
        'aurora_max_24h': 'Max 24h',
        'aurora_max_visibility': 'Max visibility',
        'aurora_3day_forecast': '3-Day Kp Forecast',
        'aurora_active': 'Storm Active!',
        'aurora_unlikely': 'Not visible',
        'aurora_very_low': 'Very unlikely',
        'aurora_low': 'Unlikely',
        'aurora_possible': 'Possible',
        'aurora_likely': 'Likely',
        'aurora_unavailable': 'Aurora data unavailable',
        'aurora_best_time': 'Best viewing',
        'aurora_setting': 'Aurora Forecast',
        'aurora_setting_desc': 'Show aurora forecast card',
        'aurora_auto': '🌌 Auto (when visible)',
        'aurora_always': '✅ Always show',
        'aurora_never': '❌ Never show',

        // Theme Mode
        'theme_section': 'APPEARANCE',
        'theme_mode': 'Theme',
        'theme_mode_desc': 'Choose app appearance',
        'theme_auto': '🌤️ Auto (weather)',
        'theme_system': '📱 System',
        'theme_dark': '🌙 Dark',
        'theme_light': '☀️ Light',

        // Temperature units
        'celsius': '°C Celsius',
        'fahrenheit': '°F Fahrenheit',

        // Time format options
        'time_24h': '24h',
        'time_12h': '12h AM/PM',

        // Detail modals
        'current': 'Current',
        'temp_high': 'High',
        'temp_low': 'Low',
        'precipitation': 'Precipitation',
        'detail_modal': 'Day Detail',
        'temperature_range': 'Temperature Range',
        'details': 'Details',
        'max_temp': 'Max Temp',
        'min_temp': 'Min Temp',
        'precipitation_chance': 'Chance of Rain',
        'max_wind': 'Max Wind',

        // Wind Directions
        'dir_N': 'N',
        'dir_NE': 'NE',
        'dir_E': 'E',
        'dir_SE': 'SE',
        'dir_S': 'S',
        'dir_SW': 'SW',
        'dir_W': 'W',
        'dir_NW': 'NW',

        'made_with': 'Made with ❤️ by Soptik1290',
        'view_source': 'View source code',

        // Subscription
        'premium_plans': 'Premium Plans',
        'unlock_subtitle': 'Unlock the full power of AI Weather',
        'restore_purchases': 'Restore Purchases',
        'cancel_anytime': 'Subscriptions auto-renew. Cancel anytime in Google Play settings.',
        'upgrade_to': 'Upgrade to',
        'current_plan': 'Current Plan',
        'most_popular': 'MOST POPULAR',
        'free_tier': 'Free',
        'free_price': '€0 / year',
        'free_desc': 'Essential weather tracking',
        'free_feat_1': 'Basic Weather Data',
        'free_feat_2': 'GPT-4o-mini Model',
        'free_feat_3': 'Standard Widget',
        'pro_tier': 'Pro',
        'pro_price': '€4.99 / year',
        'pro_desc': 'For weather enthusiasts',
        'pro_feat_1': 'More widgets (7-day, Astro, Aurora)',
        'pro_feat_2': 'Interactive widgets (Tap & Swipe)',
        'pro_feat_3': 'Advanced widget customization',
        'pro_feat_4': 'More weather sources',
        'pro_feat_5': 'Smarter AI model (GPT-5-mini)',
        'pro_feat_6': 'AI Notifications & Aurora alerts',
        // 'No Ads' removed
        'ultra_tier': 'Ultra',
        'ultra_price': '€9.99 / year',
        'ultra_desc': 'The ultimate AI experience',
        'ultra_feat_1': 'Everything in Pro',
        'ultra_feat_2': 'AstroPack (ISS, Meteor)',
        'ultra_feat_3': 'AI Explain Mode',
        'ultra_feat_4': 'Confidence Bias Setting',

        // AstroPack & Ultra

        'explain_btn': 'Why? 🤔',
        'thinking': 'Thinking...',
        'ai_meteorologist': 'AI Meteorologist',
        'explain_error': 'Could not generate explanation',
        'analyzing_data': 'Analyzing data sources...',
        'analyzing_models': 'Comparing 6 weather models',
        'analyzed_sources': 'Analyzed Sources',
    },
    cs: {
        // Weather cards
        'wind': 'Vítr',
        'humidity': 'Vlhkost',
        'uv_index': 'UV Index',
        'rain': 'Déšť',
        'snow': 'Sníh',
        'mixed_precip': 'Déšť se sněhem',
        'sunrise': 'Východ slunce',
        'sunset': 'Západ slunce',
        'feels_like': 'Pocitově',
        'now': 'Teď',
        'expected': 'Očekáváno',

        // WMO Weather Codes
        'wmo_0': 'Jasno',
        'wmo_1': 'Skoro jasno',
        'wmo_2': 'Polojasno',
        'wmo_3': 'Zataženo',
        'wmo_45': 'Mlha',
        'wmo_48': 'Mrznoucí mlha',
        'wmo_51': 'Slabé mrholení',
        'wmo_53': 'Mírné mrholení',
        'wmo_55': 'Husté mrholení',
        'wmo_56': 'Slabé mrznoucí mrholení',
        'wmo_57': 'Husté mrznoucí mrholení',
        'wmo_61': 'Slabý déšť',
        'wmo_63': 'Mírný déšť',
        'wmo_65': 'Silný déšť',
        'wmo_66': 'Slabý mrznoucí déšť',
        'wmo_67': 'Silný mrznoucí déšť',
        'wmo_71': 'Slabé sněžení',
        'wmo_73': 'Mírné sněžení',
        'wmo_75': 'Silné sněžení',
        'wmo_77': 'Sněhové zrna',
        'wmo_80': 'Slabé přeháňky',
        'wmo_81': 'Mírné přeháňky',
        'wmo_82': 'Prudké přeháňky',
        'wmo_85': 'Slabé sněhové přeháňky',
        'wmo_86': 'Silné sněhové přeháňky',
        'wmo_95': 'Bouřka',
        'wmo_96': 'Bouřka s kroupami',
        'wmo_99': 'Silná bouřka s kroupami',

        // Humidity levels
        'dry': 'Sucho',
        'comfortable': 'Příjemná',
        'humid': 'Vlhko',
        'very_humid': 'Velmi vlhko',

        // UV levels
        'low': 'Nízký',
        'moderate': 'Střední',
        'high': 'Vysoký',
        'very_high': 'Velmi vysoký',
        'extreme': 'Extrémní',

        // Forecast
        'hourly_forecast': 'Hodinová předpověď',
        'daily_forecast': '7denní předpověď',
        'today': 'Dnes',
        'day': 'den',
        'days': 'dní',

        // Search
        'search_city': 'Hledat město...',
        'use_my_location': 'Použít moji polohu',
        'detecting_location': 'Zjišťuji vaši polohu...',
        'search_title': 'Vyhledat místo',
        'search_results': 'Výsledky vyhledávání',
        'search_error': 'Nepodařilo se vyhledat lokace',
        'searching': 'Vyhledávám...',
        'no_results': 'Žádné výsledky pro',
        'try_another_city': 'Zkuste jiný název města',
        'auto_detect': 'Automaticky detekovat město',

        // Menu / Settings
        'settings': 'Nastavení',
        'language': 'Jazyk',
        'choose_language': 'Jazyk aplikace a předpovědí',
        'temperature': 'Jednotky teploty',
        'select_unit': 'Jednotky zobrazení teploty',
        'astro_pack': 'AstroPack',
        'iss_location': 'Poloha ISS',
        'active_showers': 'Aktivní meteorické roje',
        'no_showers': 'Žádné aktivní roje',
        'next_pass': 'Další přelet',
        'calculating': 'vypočítávám...',
        'peak': 'Maximum',
        'zhr': 'ZHR (Intenzita)',
        'about': 'O aplikaci',
        'about_desc': 'AI agregace počasí ze 4 zdrojů',
        'about_text': 'AI agregace počasí ze 4 zdrojů s inteligentní dedukcí.',
        'view_github': 'Zobrazit na GitHubu',
        'general': 'OBECNÉ',
        'notifications_section': 'UPOZORNĚNÍ',
        'ai_section': 'AI PŘEDPOVĚĎ',
        'about_section': 'O APLIKACI',
        'language_desc': 'Jazyk aplikace a předpovědí',
        'temp_desc': 'Jednotky zobrazení teploty',
        'time_format_desc': 'Vyberte formát času',
        'notifications_desc': 'Push notifikace o počasí',
        'aurora_alerts_desc': 'Upozornění na polární záři',
        'haptic_desc': 'Haptická odezva při interakcích',
        'confidence_desc': 'Upravuje, jak AI interpretuje meteorologické modely.',
        'notifications': 'Upozornění',
        'aurora_alerts': 'Polární záře',
        'daily_brief': 'AI Denní přehled',
        'widgets': 'Widgety',
        'customize_widget': 'Přizpůsobit widget',
        'vibration': 'Vibrace',
        'forecast_style': 'Styl předpovědi',
        'cautious': '🛡️ Opatrný',
        'balanced': '⚖️ Vyvážený',
        'optimistic': '🌟 Optimistický',

        // AI Summary
        'ai_forecast': 'AI předpověď',
        'ai_summary': 'AI shrnutí',
        'confidence': 'Spolehlivost',
        'aggregated_from': 'Agregováno z',
        'sources': 'zdrojů',
        'reliability': 'Spolehlivost',
        'widget_preview': 'Náhled',
        'widget_theme': 'Téma',
        'widget_background_color': 'Barva pozadí',
        'widget_opacity': 'Průhlednost',
        'widget_save': 'Uložit nastavení',
        'theme_option_auto': 'AUTO',
        'theme_option_light': 'SVĚTLÉ',
        'theme_option_dark': 'TMAVÉ',
        'theme_option_custom': 'VLASTNÍ',

        // Aurora
        'aurora': 'Polární záře',
        'aurora_section': 'POLÁRNÍ ZÁŘE',
        'aurora_visibility': 'Viditelnost',
        'aurora_max_24h': 'Max 24h',
        'aurora_max_visibility': 'Max viditelnost',
        'aurora_3day_forecast': '3denní Kp předpověď',
        'aurora_active': 'Bouře aktivní!',
        'aurora_unlikely': 'Neviditelná',
        'aurora_very_low': 'Velmi nepravděpodobná',
        'aurora_low': 'Nepravděpodobná',
        'aurora_possible': 'Možná',
        'aurora_likely': 'Pravděpodobná',
        'aurora_unavailable': 'Data o polární záři nedostupná',
        'aurora_best_time': 'Nejlepší čas',
        'aurora_setting': 'Polární záře',
        'aurora_setting_desc': 'Zobrazit kartu polární záře',
        'aurora_auto': '🌌 Auto (když je viditelná)',
        'aurora_always': '✅ Vždy zobrazit',
        'aurora_never': '❌ Nikdy nezobrazovat',

        // Theme Mode
        'theme_section': 'VZHLED',
        'theme_mode': 'Vzhled',
        'theme_mode_desc': 'Zvolte vzhled aplikace',
        'theme_auto': '🌤️ Auto (počasí)',
        'theme_system': '📱 Systém',
        'theme_dark': '🌙 Tmavý',
        'theme_light': '☀️ Světlý',

        // Temperature units
        'celsius': '°C Celsius',
        'fahrenheit': '°F Fahrenheit',

        // Time format options
        'time_24h': '24h',
        'time_12h': '12h AM/PM',

        // Detail modals
        'current': 'Aktuální',
        'temp_high': 'Max',
        'temp_low': 'Min',
        'precipitation': 'Srážky',
        'detail_modal': 'Detail dne',
        'temperature_range': 'Teplotní rozsah',
        'details': 'Podrobnosti',
        'max_temp': 'Max teplota',
        'min_temp': 'Min teplota',
        'precipitation_chance': 'Šance srážek',
        'max_wind': 'Max vítr',

        // Wind Directions
        'dir_N': 'S',
        'dir_NE': 'SV',
        'dir_E': 'V',
        'dir_SE': 'JV',
        'dir_S': 'J',
        'dir_SW': 'JZ',
        'dir_W': 'Z',
        'dir_NW': 'SZ',

        // Misc
        'loading_weather': 'Načítám počasí...',
        'loading_subtext': 'Získávám data předpovědi',
        'error_load': 'Nepodařilo se načíst počasí',
        'retry': 'Zkusit znovu',
        'made_with': 'Made with ❤️ by Soptik1290',
        'view_source': 'Zobrazit zdrojový kód',

        // Subscription
        'premium_plans': 'Plány Předplatného',
        'unlock_subtitle': 'Odemkněte plnou sílu AI Počasí',
        'restore_purchases': 'Obnovit nákupy',
        'cancel_anytime': 'Předplatné se obnovuje automaticky. Zrušit lze kdykoliv v nastavení Google Play.',
        'upgrade_to': 'Přejít na',
        'current_plan': 'Aktuální plán',
        'most_popular': 'NEJOBLÍBENĚJŠÍ',
        'free_tier': 'Zdarma',
        'free_price': '0 Kč / rok',
        'free_desc': 'Základní sledování počasí',
        'free_feat_1': 'Základní data o počasí',
        'free_feat_2': 'Model GPT-4o-mini',
        'free_feat_3': 'Standardní widget',
        'pro_tier': 'Pro',
        'pro_price': '129 Kč / měsíc',
        'pro_desc': 'Pro nadšence do počasí',
        'pro_feat_1': 'Více widgetů (7-denní, Astro, Aurora)',
        'pro_feat_2': 'Interaktivní widgety (Tap & Swipe)',
        'pro_feat_3': 'Pokročilá úprava widgetů',
        'pro_feat_4': 'Více zdrojů počasí',
        'pro_feat_5': 'Chytřejší AI model (GPT-5-mini)',
        'pro_feat_6': 'AI Notifikace a Aurora alerty',

        'ultra_tier': 'Ultra',
        'ultra_price': '249 Kč / měsíc',
        'ultra_desc': 'Maximální AI zážitek',
        'ultra_feat_1': 'Vše co je v Pro',
        'ultra_feat_2': 'Rozšířené grafy větru a tlaku',
        'ultra_feat_3': 'Export dat (CSV/JSON)',
        'ultra_feat_4': 'AstroPack (ISS, Meteory, Pozorování)',
        'ultra_feat_5': 'AI Vysvětlení a Shrnutí',
        'ultra_feat_6': 'Nastavení důvěry AI (Optimista/Varuj)',
        // 'ultra_feat_5': 'Předběžný přístup k novinkám', // Deprecated/Moved // Deprecated/Moved

        // AstroPack & Ultra

        'explain_btn': 'Proč? 🤔',
        'thinking': 'Přemýšlím...',
        'ai_meteorologist': 'AI Meteorolog',
        'explain_error': 'Nepodařilo se vygenerovat vysvětlení',

    },
};

/**
 * Get translation for a key in the given language.
 */
export function t(key: string, lang: Language = 'cs'): string {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
}

/**
 * Get day name for a date.
 */
export function getDayName(date: Date, lang: Language = 'cs', short: boolean = true): string {
    const dayIndex = date.getDay();
    return short
        ? dayNames[lang].short[dayIndex]
        : dayNames[lang].long[dayIndex];
}

/**
 * Format time based on time format setting.
 */
export function formatTime(date: Date, timeFormat: TimeFormat = '24h'): string {
    if (timeFormat === '12h') {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }
    return date.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/**
 * Format time string (e.g. "14:00") to 12h format if needed.
 */
export function formatTimeString(timeStr: string, timeFormat: TimeFormat = '24h'): string {
    if (timeFormat === '24h') return timeStr;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
        return timeStr;
    }
}

/**
 * Determine if aurora card should be shown based on display setting.
 */
export function shouldShowAurora(
    displaySetting: 'auto' | 'always' | 'never',
    visibilityProbability: number | null | undefined,
): boolean {
    if (displaySetting === 'always') return true;
    if (displaySetting === 'never') return false;
    // 'auto' — only show if there's any chance
    return (visibilityProbability ?? 0) > 0;
}

/**
 * Determine dark mode based on theme_mode setting, theme name, and system preference.
 */
export function shouldUseDarkMode(
    themeMode: 'auto' | 'system' | 'dark' | 'light',
    themeName: string,
    systemPrefersDark: boolean = false,
): boolean {
    const darkThemes = ['storm', 'clear_night', 'cloudy_night', 'sunset'];
    switch (themeMode) {
        case 'dark':
            return true;
        case 'light':
            return false;
        case 'system':
            return systemPrefersDark;
        case 'auto':
        default:
            return darkThemes.includes(themeName);
    }
}
