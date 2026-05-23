import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Routes } from '@/constants/routes';
import { setApiHandlers } from '@/services/api/client';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  userHasAccess,
  type LoginPayload,
  type RegisterPayload,
} from '@/services/api/seller';
import type { SellerUser } from '@/types/seller-api';

type AuthContextValue = {
  user: SellerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAccess: boolean;
  signIn: (user: SellerUser) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<SellerUser | null>;
  register: (payload: RegisterPayload) => Promise<SellerUser>;
  login: (payload: LoginPayload) => Promise<SellerUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SellerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = user ? userHasAccess(user) : false;
  const isAuthenticated = !!user;

  const navigateByAccess = useCallback((u: SellerUser) => {
    if (userHasAccess(u)) {
      router.replace(Routes.perfil);
    } else {
      router.replace(Routes.suscripcion);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // token ya inválido
    }
    setUser(null);
    router.replace(Routes.registro);
  }, []);

  const signIn = useCallback((u: SellerUser) => {
    setUser(u);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    setUser(res.user);
    return res.user;
  }, []);

  useEffect(() => {
    setApiHandlers({
      onUnauthorized: () => {
        setUser(null);
        router.replace(Routes.registro);
      },
      onForbidden: () => {
        router.replace(Routes.suscripcion);
      },
    });
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await refreshSession();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      hasAccess,
      signIn,
      signOut,
      refreshSession,
      register,
      login,
    }),
    [user, isLoading, isAuthenticated, hasAccess, signIn, signOut, refreshSession, register, login],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}

export function useAuthNavigation() {
  const { isLoading, isAuthenticated, hasAccess } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(Routes.registro);
    } else if (!hasAccess) {
      router.replace(Routes.suscripcion);
    }
  }, [isLoading, isAuthenticated, hasAccess]);
}
