import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingOverlay } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';
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
        tabBarActiveTintColor: IsiPlazaColors.primary,
        tabBarInactiveTintColor: IsiPlazaColors.textSecondary,
        tabBarStyle: {
          backgroundColor: IsiPlazaColors.white,
          borderTopColor: IsiPlazaColors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Dar de alta',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: 'Métricas',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
