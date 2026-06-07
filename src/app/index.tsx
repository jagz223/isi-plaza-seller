import { Redirect } from 'expo-router';

import { LoadingOverlay } from '@/components/isi-plaza';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useConsumerAuth } from '@/contexts/ConsumerAuthContext';

export default function Index() {
  const { isLoading: isAuthLoading, isAuthenticated, hasAccess } = useAuth();
  const { appMode, isLoadingMode } = useAppMode();
  const { isLoading: isConsumerLoading, isAuthenticated: isConsumerAuthenticated } = useConsumerAuth();

  if (isAuthLoading || isLoadingMode || isConsumerLoading) {
    return <LoadingOverlay />;
  }

  if (isAuthenticated) {
    if (!hasAccess) {
      return <Redirect href={Routes.suscripcion} />;
    }
    return <Redirect href={Routes.perfil} />;
  }

  if (appMode === 'comprador') {
    if (!isConsumerAuthenticated) {
      return <Redirect href="/(acceso)/comprador-acceso" />;
    }
    return <Redirect href="/(buyer)/buscar" />;
  }

  // Si no está autenticado, siempre mandarlo a elegir modo.
  return <Redirect href="/(acceso)/acceso-modo" />;

}
