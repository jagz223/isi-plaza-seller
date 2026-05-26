import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { LoadingOverlay } from '@/components/isi-plaza';
import { useAppMode } from '@/contexts/AppModeContext';

export default function CerrarSesionScreen() {
  const { clearAppMode } = useAppMode();
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await clearAppMode();
      router.replace('/(acceso)/acceso-modo');
    };
    logout();
  }, [clearAppMode, router]);

  return <LoadingOverlay />;
}
