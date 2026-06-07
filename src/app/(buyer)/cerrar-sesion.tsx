import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { LoadingOverlay } from '@/components/isi-plaza';
import { useAppMode } from '@/contexts/AppModeContext';
import { useConsumerAuth } from '@/contexts/ConsumerAuthContext';

export default function CerrarSesionScreen() {
  const { clearAppMode } = useAppMode();
  const { signOut } = useConsumerAuth();
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await signOut();
      await clearAppMode();
      router.replace('/(acceso)/acceso-modo');
    };
    void logout();
  }, [clearAppMode, router, signOut]);

  return <LoadingOverlay />;
}
