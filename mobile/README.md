# Weatherly Mobile App

AI-powered weather app for iOS and Android with native widgets, built with React Native.

## 📱 Features

### FREE Tier
- Current weather widget
- Basic weather app (current + 3 days)
- 1 weather provider (Open-Meteo)
- AI model: GPT-4o-mini

### PRO (€4.99/month)
- Multi-day forecast widgets (3, 5, 7 days)
- Aurora forecast widget
- Interactive widgets (tap for detail, swipe for next day)
- Widget customization (opacity, themes, colors)
- 6 weather providers
- AI model: GPT-5-mini
- Push notifications with AI recommendations

### Ultra (€9.99/month)
- Everything in PRO
- Extended chart widgets
- Data export (CSV, JSON, PDF)
- AstroPack (ISS passes, meteor showers, stargazing index)
- AI Explain Mode (source differences, reasoning)
- Personal Confidence Bias (cautious/balanced/optimistic)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- React Native development environment
- Xcode 15+ (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Install dependencies
cd mobile
npm install

# iOS: Install CocoaPods
cd ios
pod install
cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Backend Connection

The app connects to the Weatherly API. For development:
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Physical device: Use your computer's local IP

Make sure the backend is running:
```bash
cd ..
uv run mcp-weather-api
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/        # App screens (Home, Search, Settings, etc.)
│   ├── components/     # Reusable UI components
│   ├── services/       # API clients (weather, subscription)
│   ├── stores/         # Zustand state management
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   └── assets/         # Images, fonts, etc.
├── ios/
│   ├── Weatherly/              # Main app
│   └── WeatherlyWidget/        # WidgetKit extension (coming soon)
├── android/
│   └── app/src/main/java/com/weatherly/ai/
│       └── widget/             # Glance widgets (coming soon)
├── App.tsx             # Root component
├── app.json            # App configuration
└── package.json        # Dependencies
```

## 🔧 Configuration

### RevenueCat
Update API keys in `src/services/subscriptionService.ts`:
```typescript
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key';
```

### Firebase
1. Create a Firebase project
2. Add iOS and Android apps
3. Download config files:
   - iOS: `GoogleService-Info.plist` → `ios/Weatherly/`
   - Android: `google-services.json` → `android/app/`

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| react-native | Core framework |
| @react-navigation | Navigation |
| zustand | State management |
| @tanstack/react-query | Data fetching |
| react-native-purchases | RevenueCat (subscriptions) |
| @react-native-firebase | Push notifications |
| react-native-reanimated | Animations |
| react-native-gesture-handler | Gestures |
| lucide-react-native | Icons |

## 🏗️ Building for Production

### iOS
```bash
# Build for App Store
npx react-native build-ios --mode Release
```

### Android
```bash
# Build APK
cd android && ./gradlew assembleRelease

# Build AAB for Play Store
cd android && ./gradlew bundleRelease
```

## 📄 License

Copyright (c) 2026 Tomáš Stark. All rights reserved.
