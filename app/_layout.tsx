import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { ToastProvider, UpdateNotificationToast } from '@/components/ui';
import { colors } from '@/theme';

import { bootstrapSession } from '@/features/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented
});

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // Bootstrap session (anonymous sign-in if no active session)
        await bootstrapSession();
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style="light" />
            <UpdateNotificationToast />
            <View style={styles.outerContainer}>
              <View style={styles.responsiveColumn}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bg },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="wallet/history"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="game/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'fullScreenModal',
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="leaderboard"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen
                    name="dev/native-check"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                    }}
                  />
                  <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
                </Stack>
              </View>
            </View>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07140F',
  },
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#07140F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsiveColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    height: '100%',
    backgroundColor: colors.bg,
    position: 'relative',
    overflow: 'hidden',
  },
});
