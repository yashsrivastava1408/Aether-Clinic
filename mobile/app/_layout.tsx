import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AnimatedSplash from '../components/AnimatedSplash';
import { AuthProvider } from '@/context/AuthContext';



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  if (!isSplashFinished) {
    return <AnimatedSplash onFinish={() => setIsSplashFinished(true)} />;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right', // Smooth slide for all
              gestureEnabled: true, // Allow swipe back
              animationDuration: 400, // Slightly slower for 'smoothness'
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
