import type { Href } from 'expo-router';

export const Routes = {
  registro: '/(auth)/registro' as Href,
  suscripcion: '/(auth)/suscripcion' as Href,
  perfil: '/(app)/perfil' as Href,
  metricas: '/(app)/metricas' as Href,
  ajustes: '/(app)/ajustes' as Href,
} as const;
