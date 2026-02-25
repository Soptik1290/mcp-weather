/**
 * Weatherly - AI-Powered Weather App
 * React Native Mobile Application
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { HomeScreen, SubscriptionScreen, WidgetConfigScreen, AstroPackScreen, OnboardingScreen } from './src/screens';
import { subscriptionService, admobService } from './src/services';

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
  Subscription: undefined;
  WidgetConfig: undefined;
  AstroPack: undefined;
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
    },
  },
});

import { useSubscriptionStore, useSettingsStore } from './src/stores';
import { NativeModules, Platform } from 'react-native';
import { initBackgroundFetch } from './src/tasks/BackgroundJob';

function App(): React.JSX.Element {
  const tier = useSubscriptionStore((state) => state.tier);
  const hasCompletedOnboarding = useSettingsStore((state) => state.settings.hasCompletedOnboarding);

  useEffect(() => {
    // Dynamic Widget restrictions
    if (Platform.OS === 'android' && NativeModules.WidgetModule) {
      const isPro = tier === 'pro' || tier === 'ultra';
      const isUltra = tier === 'ultra';

      try {
        NativeModules.WidgetModule.setWidgetEnabled("DailyWidget", isPro);
        NativeModules.WidgetModule.setWidgetEnabled("AstroWidget", isUltra);
      } catch (e) {
        console.warn("Failed to set widget visibility", e);
      }
    }
  }, [tier]);

  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      try {
        await subscriptionService.initialize();
        await admobService.initialize();
        await initBackgroundFetch(); // Start background jobs
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={hasCompletedOnboarding ? "Home" : "Onboarding"}
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'Weatherly',
                }}
              />
              {/* Additional screens will be added here */}
              <Stack.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="WidgetConfig"
                component={WidgetConfigScreen}
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="AstroPack"
                component={AstroPackScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
