import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { BrandSplash } from '@/components/isi-plaza/BrandSplash';
import { PlatformGate } from '@/components/PlatformGate';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConsumerAuthProvider } from '@/contexts/ConsumerAuthContext';
import { PlatformAccessProvider } from '@/contexts/PlatformAccessContext';
import { AppModeProvider } from '@/contexts/AppModeContext';
import {
  BRAND_SPLASH_DURATION_MS,
  NATIVE_SPLASH_DURATION_MS,
} from '@/constants/splash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showBrandSplash, setShowBrandSplash] = useState(false);

  useEffect(() => {
    const nativeTimer = setTimeout(() => {
      void SplashScreen.hideAsync();
      setShowBrandSplash(true);
    }, NATIVE_SPLASH_DURATION_MS);

    const brandTimer = setTimeout(() => {
      setShowBrandSplash(false);
    }, NATIVE_SPLASH_DURATION_MS + BRAND_SPLASH_DURATION_MS);

    return () => {
      clearTimeout(nativeTimer);
      clearTimeout(brandTimer);
    };
  }, []);

  return (
    <>
      <BrandSplash visible={showBrandSplash} />
      <AppModeProvider>
        <PlatformAccessProvider>
          <PlatformGate>
            <AuthProvider>
              <ConsumerAuthProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { flex: 1, overflow: 'hidden' },
                  }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(acceso)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="(buyer)" />
                </Stack>
                <StatusBar style="dark" />
              </ConsumerAuthProvider>
            </AuthProvider>
          </PlatformGate>
        </PlatformAccessProvider>
      </AppModeProvider>
    </>
  );
}

