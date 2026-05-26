import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { IsiPlazaColors } from '@/constants/isi-plaza';

export default function BuyerLayout() {
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
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mayoristas"
        options={{
          title: 'Mayoristas',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
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
