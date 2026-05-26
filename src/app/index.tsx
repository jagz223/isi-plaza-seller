import { Redirect } from 'expo-router';

import { LoadingOverlay } from '@/components/isi-plaza';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/contexts/AppModeContext';

export default function Index() {
  const { isLoading: isAuthLoading, isAuthenticated, hasAccess } = useAuth();
  const { appMode, isLoadingMode } = useAppMode();

  if (isAuthLoading || isLoadingMode) {
    return <LoadingOverlay />;
  }

  if (isAuthenticated) {
    if (!hasAccess) {
      return <Redirect href={Routes.suscripcion} />;
    }
    return <Redirect href={Routes.perfil} />;
  }

  if (appMode === 'comprador') {
    return <Redirect href="/(buyer)/buscar" />;
  }

  // Si no está autenticado, siempre mandarlo a elegir modo.
  return <Redirect href="/(acceso)/acceso-modo" />;

}
