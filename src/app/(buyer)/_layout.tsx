import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { LoadingOverlay } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';
import { useConsumerAuth } from '@/contexts/ConsumerAuthContext';

export default function BuyerLayout() {
  const { isLoading, isAuthenticated } = useConsumerAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(acceso)/comprador-acceso" />;
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
        name="buscar"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medicos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="guardados"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cerrar-sesion"
        options={{
          title: 'Cerrar',
          tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
