import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BrandSplash } from '@/components/isi-plaza';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <BrandSplash />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
