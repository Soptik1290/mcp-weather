/**
 * Internationalization (i18n) module for the mobile app.
 * Ported from frontend/src/lib/settings.tsx to match PC version.
 */

export type Language = 'en' | 'cs';
export type TimeFormat = '24h' | '12h';

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
        'pressure': 'Pressure',
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
        'try_again': 'Try Again',
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
        'astro_pack_desc': 'ISS, Meteors & Best Viewing',
        'data_export': 'Data Export',
        'export_json': 'Export JSON',
        'export_json_desc': 'Full weather data',
        'export_csv': 'Export CSV',
        'export_csv_desc': 'Forecast table',
        'iss_location': 'ISS Location',
        'active_showers': 'Active Meteor Showers',
        'no_showers': 'No active meteor showers',
        'next_pass': 'Next pass',
        'calculating': 'calculating...',
        'peak': 'Peak',
        'zhr': 'ZHR',
        'next_eclipses': 'Next Eclipses',
        'solar_eclipse': 'Solar Eclipse',
        'lunar_eclipse': 'Lunar Eclipse',
        'about': 'About',
        'about_desc': 'AI Weather Aggregator (4 sources)',
        'about_desc_premium': 'AI Weather Aggregator (7 premium sources)',
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
        'astro_alerts': 'Astronomy Alerts',
        'astro_alerts_desc': 'Eclipse and rare event alerts',
        'haptic_desc': 'Haptic feedback on interactions',
        'confidence_desc': 'How optimistic AI will be',
        'vibration': 'Vibration',
        'notifications': 'Notifications',
        'forecast_style': 'Forecast style',
        'cautious': 'Cautious',
        'balanced': 'Balanced',
        'optimistic': 'Optimistic',

        // AI Summary
        'ai_forecast': 'AI-powered forecast',
        'ai_summary': 'AI Summary',
        'ai_summary_unavailable': 'AI Summary temporarily unavailable',
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
        'aurora_setting_desc': 'When to show the Aurora activity widget',
        'aurora_auto': 'Auto (when visible)',
        'aurora_always': 'Always show',
        'aurora_never': 'Never show',

        // Theme Mode
        'theme_section': 'APPEARANCE',
        'theme_mode': 'Theme',
        'theme_mode_desc': 'Choose app appearance',
        'theme_auto': 'Auto (weather)',
        'theme_system': 'System',
        'theme_dark': 'Dark',
        'theme_light': 'Light',

        // Temperature units
        'celsius': '°C Celsius',
        'fahrenheit': '°F Fahrenheit',

        // Time format options
        'settings_time_format': 'Time Format',
        'time_24h': '24h',
        'time_12h': '12h AM/PM',

        // Subscription Button
        'weatherly_premium': 'Weatherly Premium',
        'unlock_features': 'Unlock 5-Mini, Widgets & More',

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
        'made_with_love': 'Made with ❤️ by Tomáš Stark',
        'support_dev': 'Support the Developer',
        'watch_ad': 'Watch a short ad',
        'ad_error_title': 'Error',
        'ad_error_msg': 'The ad could not be loaded. Please try again later.',
        'ad_loading': 'Loading ad...',
        'thank_you_title': 'Thank you!',
        'thank_you_msg': 'Thank you so much for your support, it means a lot for the development of the app.',
        'customize_widget': 'Customize Widget',
        'analyzing_data': 'Analyzing data sources...',

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
        'free_feat_2': 'Basic AI',
        'free_feat_3': 'Standard Widget',
        'pro_tier': 'Pro',
        'pro_price': '€4.99 / year',
        'pro_desc': 'For weather enthusiasts',
        'pro_feat_1': 'More widgets (7-day, Astro, Aurora)',
        'pro_feat_2': 'Interactive widgets (Tap & Swipe)',
        'pro_feat_3': 'Advanced widget customization',
        'pro_feat_4': 'More weather sources',
        'pro_feat_5': 'Smarter AI for better forecasts',
        'pro_feat_6': 'AI Notifications & Aurora alerts',
        // 'No Ads' removed
        'ultra_tier': 'Ultra',
        'ultra_price': '€9.99 / year',
        'ultra_desc': 'The ultimate AI experience',
        'ultra_feat_1': 'Everything in Pro',
        'ultra_feat_2': 'Extended wind & pressure charts',
        'ultra_feat_3': 'Data export (CSV/JSON)',
        'ultra_feat_4': 'AstroPack (ISS, Meteors)',
        'ultra_feat_5': 'AI Explanation & Summary',
        'ultra_feat_6': 'Confidence Bias Setting',

        // Subscription Alerts
        'sub_error_pkg_not_found': 'Package not found',
        'sub_success_title': 'Success!',
        'sub_success_msg': 'Welcome to PREMIUM! Features unlocked.',
        'sub_restored_title': 'Restored',
        'sub_restored_msg': 'Purchases restored successfully.',
        'info': 'Info',
        'manage_subs_in_store': 'Manage your subscription in the store settings.',
        'restore': 'Restore',

        // Moon Phase
        'moon_phase': 'Moon Phase',
        'moon_illumination': 'Illumination',
        'moonrise': 'Moonrise',
        'moonset': 'Moonset',
        'next_full_moon': 'Next Full Moon',

        // Model Agreement
        'models_diverge': 'Models diverge',

        // Onboarding
        'welcome_title': 'Welcome to Weatherly',
        'welcome_subtitle': 'AI-powered weather, just for you',
        'choose_location': 'Where are you?',
        'choose_location_subtitle': 'Set your default weather location',
        'continue_btn': 'Continue',
        'lets_go': "Let's go!",
        'geo_permission_denied': 'Location access was denied',
        'geo_unavailable': 'Location is unavailable',
        'geo_timeout': 'Location request timed out',
        'geo_error': 'Failed to get location',
        'geo_permission_title': 'Location Permission',
        'geo_permission_msg': 'Weatherly needs access to your location to show local weather.',
        'geo_ask_later': 'Ask Later',
        'geo_deny': 'Deny',
        'geo_allow': 'Allow',
        'geo_cancel': 'Cancel',
        'geo_settings': 'Settings',
        'geo_denied_alert': 'Permission Denied',
        'geo_denied_msg': 'Please enable location access in settings to use geolocation.',

        // Onboarding - Subscription step
        'onboarding_plans_title': 'Upgrade Your Experience',
        'onboarding_plans_subtitle': 'Get the most out of Weatherly with a premium plan',
        'continue_free': 'Continue for free',

        // AstroPack & Ultra

        'explain_btn': 'Why? 🤔',
        'thinking': 'Thinking...',
        'ai_meteorologist': 'AI Meteorologist',
        'explain_error': 'Failed to generate explanation',
        'analyzing_models': 'Comparing 6 weather models',
        'analyzed_sources': 'Analyzed Sources',
        'temp_trend': 'Temperature Trend',
        'widget_settings': 'Widget Settings',
        'customize_appearance': 'Customize appearance',

        // Charts
        'charts_section': 'Charts',
        'wind_chart': 'Wind Speed Chart',
        'wind_chart_desc': 'Show 12-hour wind speed trend',
        'pressure_chart': 'Pressure Chart',
        'pressure_chart_desc': 'Show 12-hour pressure trend',
        'precipitation_chart': 'Precipitation Chart',
        'precipitation_chart_desc': 'Show 12-hour precipitation forecast',
        'wind_trend': 'Wind Speed',
        'pressure_trend': 'Pressure',
        'precipitation_trend': 'Precipitation',
    },
    cs: {
        // Weather cards
        'wind': 'Vítr',
        'humidity': 'Vlhkost',
        'pressure': 'Tlak',
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
        'try_again': 'Zkusit znovu',
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
        'astro_pack_desc': 'ISS, Meteory a nejlepší viditelnost',
        'data_export': 'Export dat',
        'export_json': 'Exportovat JSON',
        'export_json_desc': 'Kompletní data o počasí',
        'export_csv': 'Exportovat CSV',
        'export_csv_desc': 'Tabulka s předpovědí',
        'iss_location': 'Poloha ISS',
        'active_showers': 'Aktivní meteorické roje',
        'no_showers': 'Žádné aktivní roje',
        'next_pass': 'Další přelet',
        'calculating': 'vypočítávám...',
        'peak': 'Maximum',
        'zhr': 'ZHR (Intenzita)',
        'next_eclipses': 'Další zatmění',
        'solar_eclipse': 'Zatmění Slunce',
        'lunar_eclipse': 'Zatmění Měsíce',
        'about': 'O aplikaci',
        'about_desc': 'AI agregace počasí ze 4 zdrojů',
        'about_desc_premium': 'AI agregace počasí ze 7 prémiových zdrojů',
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
        'astro_alerts': 'Astro Upozornění',
        'astro_alerts_desc': 'Alert na zatmění a vzácné jevy',
        'haptic_desc': 'Haptická odezva při interakcích',
        'confidence_desc': 'Upravuje, jak AI interpretuje meteorologické modely.',
        'notifications': 'Upozornění',
        'aurora_alerts': 'Polární záře',
        'daily_brief': 'AI Denní přehled',
        'widgets': 'Widgety',
        'customize_widget': 'Přizpůsobit widget',
        'vibration': 'Vibrace',
        'forecast_style': 'Styl předpovědi',
        'cautious': 'Opatrný',
        'balanced': 'Vyvážený',
        'optimistic': 'Optimistický',

        // AI Summary
        'ai_forecast': 'AI předpověď',
        'ai_summary': 'AI shrnutí',
        'ai_summary_unavailable': 'AI shrnutí je dočasně nedostupné.',
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
        'aurora_setting_desc': 'Kdy zobrazovat widget s aktivitou polární záře',
        'aurora_auto': 'Auto (když je viditelná)',
        'aurora_always': 'Vždy zobrazit',
        'aurora_never': 'Nikdy nezobrazovat',

        // Theme Mode
        'theme_section': 'VZHLED',
        'theme_mode': 'Vzhled',
        'theme_mode_desc': 'Zvolte vzhled aplikace',
        'theme_auto': 'Auto (počasí)',
        'theme_system': 'Systém',
        'theme_dark': 'Tmavý',
        'theme_light': 'Světlý',

        // Temperature units
        'celsius': '°C Celsius',
        'fahrenheit': '°F Fahrenheit',

        // Time format options
        'settings_time_format': 'Formát času',
        'time_24h': '24h',
        'time_12h': '12h AM/PM',

        // Subscription Button
        'weatherly_premium': 'Weatherly Premium',
        'unlock_features': 'Odemkněte 5-Mini, Widgety a další',

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
        'made_with_love': 'Vytvořeno s ❤️ od Tomáš Stark',
        'support_dev': 'Podpořit vývojáře',
        'watch_ad': 'Zhlédnutím reklamy',
        'ad_error_title': 'Chyba',
        'ad_error_msg': 'Reklamu se bohužel nepodařilo načíst k zobrazení. Zkuste to prosím později.',
        'ad_loading': 'Načítám inzerát...',
        'thank_you_title': 'Děkujeme!',
        'thank_you_msg': 'Moc děkujeme za tvoji podporu, moc to pro vývoj aplikace znamená.',
        'analyzing_data': 'Analyzuji data...',
        'analyzing_models': 'Porovnávám 6 modelů počasí',
        'analyzed_sources': 'Analyzované zdroje',

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
        'free_feat_2': 'Základní AI',
        'free_feat_3': 'Standardní widget',
        'pro_tier': 'Pro',
        'pro_price': '129 Kč / měsíc',
        'pro_desc': 'Pro nadšence do počasí',
        'pro_feat_1': 'Více widgetů (7-denní, Astro, Aurora)',
        'pro_feat_2': 'Interaktivní widgety (Tap & Swipe)',
        'pro_feat_3': 'Pokročilá úprava widgetů',
        'pro_feat_4': 'Více zdrojů počasí',
        'pro_feat_5': 'Chytřejší AI pro lepší předpověď',
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

        // Subscription Alerts
        'sub_error_pkg_not_found': 'Balíček nenalezen',
        'sub_success_title': 'Úspěch!',
        'sub_success_msg': 'Vítejte v PREMIUM! Funkce odemčeny.',
        'sub_restored_title': 'Obnoveno',
        'sub_restored_msg': 'Nákupy úspěšně obnoveny.',
        'info': 'Info',
        'manage_subs_in_store': 'Spravujte své předplatné v nastavení obchodu.',
        'restore': 'Obnovit',

        // Moon Phase
        'moon_phase': 'Fáze Měsíce',
        'moon_illumination': 'Osvětlení',
        'moonrise': 'Východ Měsíce',
        'moonset': 'Západ Měsíce',
        'next_full_moon': 'Další úplněk',

        // Model Agreement
        'models_diverge': 'Modely se rozcházejí',

        // Onboarding
        'welcome_title': 'Vítejte ve Weatherly',
        'welcome_subtitle': 'Počasí poháněné AI, jen pro vás',
        'choose_location': 'Kde se nacházíte?',
        'choose_location_subtitle': 'Nastavte výchozí lokaci pro počasí',
        'continue_btn': 'Pokračovat',
        'lets_go': 'Pojďme na to!',
        'geo_permission_denied': 'Přístup k poloze byl zamítnut',
        'geo_unavailable': 'Poloha není dostupná',
        'geo_timeout': 'Časový limit pro získání polohy vypršel',
        'geo_error': 'Nepodařilo se získat polohu',
        'geo_permission_title': 'Povolení polohy',
        'geo_permission_msg': 'Weatherly potřebuje přístup k vaší poloze pro zobrazení místního počasí.',
        'geo_ask_later': 'Zeptat se později',
        'geo_deny': 'Zamítnout',
        'geo_allow': 'Povolit',
        'geo_cancel': 'Zrušit',
        'geo_settings': 'Nastavení',
        'geo_denied_alert': 'Povolení zamítnuto',
        'geo_denied_msg': 'Pro použití geolokace povolte přístup k poloze v nastavení.',

        // Onboarding - Subscription step
        'onboarding_plans_title': 'Vylepšete si zážitek',
        'onboarding_plans_subtitle': 'Využijte Weatherly naplno s placeným plánem',
        'continue_free': 'Pokračovat zdarma',

        // AstroPack & Ultra

        'explain_btn': 'Proč? 🤔',
        'thinking': 'Přemýšlím...',
        'ai_meteorologist': 'AI Meteorolog',
        'explain_error': 'Nepodařilo se vygenerovat vysvětlení',
        'temp_trend': 'Vývoj teploty',
        'widget_settings': 'Nastavení widgetů',
        'customize_appearance': 'Přizpůsobit vzhled',

        // Charts
        'charts_section': 'Grafy',
        'wind_chart': 'Graf rychlosti větru',
        'wind_chart_desc': 'Zobrazit 12hodinový trend větru',
        'pressure_chart': 'Graf tlaku',
        'pressure_chart_desc': 'Zobrazit 12hodinový trend tlaku',
        'precipitation_chart': 'Graf srážek',
        'precipitation_chart_desc': 'Zobrazit 12hodinovou předpověď srážek',
        'wind_trend': 'Rychlost větru',
        'pressure_trend': 'Tlak',
        'precipitation_trend': 'Srážky',
    },
};

/**
 * Get translation for a key in the given language.
 */
export function t(key: string, lang: Language = 'cs'): string {
    return translations[lang]?.[key] || translations.en?.[key] || key;
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
 * Parse a hex color string to RGB components (0-255).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const cleaned = hex.replace('#', '');
    if (cleaned.length !== 6) return null;
    return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16),
    };
}

/**
 * Calculate relative luminance of a color using WCAG 2.0 formula.
 * Includes proper sRGB gamma linearization.
 * Returns a value between 0 (black) and 1 (white).
 */
function relativeLuminance(r: number, g: number, b: number): number {
    // sRGB linearization (gamma correction)
    const linearize = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Determine if a gradient is "dark" based on the average luminance of its colors.
 * Returns true if the gradient is dark (needs white text), false if light (needs dark text).
 */
function isGradientDark(gradient: string[]): boolean {
    if (!gradient || gradient.length === 0) return true;

    let totalLuminance = 0;
    let count = 0;
    for (const hex of gradient) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            totalLuminance += relativeLuminance(rgb.r, rgb.g, rgb.b);
            count++;
        }
    }
    // Threshold: below 0.35 average luminance = dark gradient → use white text
    // This is lower than the typical 0.5 to account for weather gradients which
    // tend to be medium-bright pastels that need dark text for readability.
    return count > 0 ? (totalLuminance / count) < 0.35 : true;
}

/**
 * Determine dark mode based on theme_mode setting and gradient luminance.
 * In 'auto' mode, directly analyzes the gradient colors to decide text color.
 */
export function shouldUseDarkMode(
    themeMode: 'auto' | 'system' | 'dark' | 'light',
    themeName: string,
    systemPrefersDark: boolean = false,
    themeIsDark?: boolean,
    gradient?: string[],
): boolean {
    switch (themeMode) {
        case 'dark':
            return true;
        case 'light':
            return false;
        case 'system':
            return systemPrefersDark;
        case 'auto':
        default:
            // Primary: calculate from actual gradient colors
            if (gradient && gradient.length > 0) {
                return isGradientDark(gradient);
            }
            // Fallback: use backend is_dark flag if available
            if (themeIsDark !== undefined) {
                return themeIsDark;
            }
            // Last resort: hardcoded dark theme names
            const darkThemes = ['storm', 'clear_night', 'cloudy_night', 'sunset', 'fog_night', 'rain_night', 'snow_night', 'hail_night', 'sandstorm_night', 'blizzard_night', 'extreme_heat_night', 'extreme_cold_night', 'wind_night'];
            return darkThemes.includes(themeName);
    }
}

