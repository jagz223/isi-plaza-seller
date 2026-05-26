import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PlatformGate } from '@/components/PlatformGate';
import { BrandSplash } from '@/components/isi-plaza';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlatformAccessProvider } from '@/contexts/PlatformAccessContext';
import { AppModeProvider } from '@/contexts/AppModeContext';

export default function RootLayout() {
  return (
    <AppModeProvider>
      <PlatformAccessProvider>
        <PlatformGate>
          <AuthProvider>
            <BrandSplash />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(acceso)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(buyer)" />
            </Stack>
            <StatusBar style="dark" />
          </AuthProvider>
        </PlatformGate>
      </PlatformAccessProvider>
    </AppModeProvider>
  );
}
