import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingOverlay } from '@/components/isi-plaza';
import { DoctorUIColors } from '@/constants/doctor-ui';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { isLoading, isAuthenticated, hasAccess } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isAuthenticated) {
    return <Redirect href={Routes.registro} />;
  }

  if (!hasAccess) {
    return <Redirect href={Routes.suscripcion} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DoctorUIColors.primary,
        tabBarInactiveTintColor: DoctorUIColors.textMuted,
        tabBarStyle: {
          backgroundColor: DoctorUIColors.white,
          borderTopColor: DoctorUIColors.slot,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: DoctorUIColors.screen,
        },
      }}>
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size + 4} color={color} />,
        }}
      />
    </Tabs>
  );
}
