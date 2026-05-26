import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppMode = 'comprador' | 'mayorista' | null;

interface AppModeContextValue {
  appMode: AppMode;
  isLoadingMode: boolean;
  setAppMode: (mode: AppMode) => Promise<void>;
  clearAppMode: () => Promise<void>;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [appMode, setModeState] = useState<AppMode>(null);
  const [isLoadingMode, setIsLoadingMode] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('ISI_PLAZA_APP_MODE').then((mode) => {
      if (mode === 'comprador' || mode === 'mayorista') {
        setModeState(mode as AppMode);
      }
      setIsLoadingMode(false);
    });
  }, []);

  const setAppMode = async (mode: AppMode) => {
    setModeState(mode);
    if (mode) {
      await AsyncStorage.setItem('ISI_PLAZA_APP_MODE', mode);
    } else {
      await AsyncStorage.removeItem('ISI_PLAZA_APP_MODE');
    }
  };

  const clearAppMode = async () => {
    setModeState(null);
    await AsyncStorage.removeItem('ISI_PLAZA_APP_MODE');
  };

  return (
    <AppModeContext.Provider value={{ appMode, isLoadingMode, setAppMode, clearAppMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode debe usarse dentro de AppModeProvider');
  return ctx;
}
