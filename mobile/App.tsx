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

import { HomeScreen, SubscriptionScreen, WidgetConfigScreen } from './src/screens';
import { subscriptionService } from './src/services';

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
  Subscription: undefined;
  WidgetConfig: undefined;
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

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      try {
        await subscriptionService.initialize();
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
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
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
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default App;
