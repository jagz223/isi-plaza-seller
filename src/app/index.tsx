import { Redirect } from 'expo-router';

import { LoadingOverlay } from '@/components/isi-plaza';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
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

  return <Redirect href={Routes.perfil} />;
}
