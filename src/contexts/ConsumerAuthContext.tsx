import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  fetchConsumerMe,
  getStoredConsumerToken,
  registerConsumerGuest,
  setStoredConsumerToken,
  signOutConsumer,
} from '@/services/api/consumer';
import type { ConsumerUser } from '@/types/consumer-api';

type ConsumerAuthContextValue = {
  user: ConsumerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  registerGuest: (name: string, whatsapp: string) => Promise<ConsumerUser>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<ConsumerUser | null>;
};

const ConsumerAuthContext = createContext<ConsumerAuthContextValue | null>(null);

export function ConsumerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ConsumerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = await getStoredConsumerToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const me = await fetchConsumerMe();
      setUser(me);
      return me;
    } catch {
      await setStoredConsumerToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const registerGuest = useCallback(async (name: string, whatsapp: string) => {
    const res = await registerConsumerGuest({ name, whatsapp });
    await setStoredConsumerToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutConsumer();
    } catch {
      // token ya inválido
    }
    await setStoredConsumerToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      registerGuest,
      signOut,
      refreshSession,
    }),
    [user, isLoading, registerGuest, signOut, refreshSession],
  );

  return <ConsumerAuthContext.Provider value={value}>{children}</ConsumerAuthContext.Provider>;
}

export function useConsumerAuth(): ConsumerAuthContextValue {
  const ctx = useContext(ConsumerAuthContext);
  if (!ctx) {
    throw new Error('useConsumerAuth debe usarse dentro de ConsumerAuthProvider');
  }
  return ctx;
}
