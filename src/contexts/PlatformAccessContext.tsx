import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { PLATFORM_ACCESS } from '@/config/platform-access';
import { getFirebaseFirestore } from '@/lib/firebase';

type PlatformAccessState = {
  appEnabled: boolean | null;
  failOpen: boolean;
  firestoreError: string | null;
};

const PlatformAccessContext = createContext<PlatformAccessState>({
  appEnabled: null,
  failOpen: false,
  firestoreError: null,
});

/** Si no puede leer Firestore: true = dejar pasar, false = pantalla negra (más seguro). */
function isFailOpen(): boolean {
  return process.env.EXPO_PUBLIC_PLATFORM_ACCESS_FAIL_OPEN === 'true';
}

function parseAppEnabled(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return null;
}

export function PlatformAccessProvider({ children }: { children: React.ReactNode }) {
  const [appEnabled, setAppEnabled] = useState<boolean | null>(null);
  const [failOpen, setFailOpen] = useState(isFailOpen());
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const failOpenOnError = isFailOpen();

    if (!db) {
      if (__DEV__) {
        console.warn('[PlatformAccess] Firebase no configurado en .env');
      }
      setFailOpen(true);
      setFirestoreError('firebase_not_configured');
      setAppEnabled(failOpenOnError);
      return;
    }

    const ref = doc(db, PLATFORM_ACCESS.collection, PLATFORM_ACCESS.document);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setFirestoreError(null);

        if (!snapshot.exists()) {
          if (__DEV__) {
            console.warn('[PlatformAccess] Documento platform/access no existe');
          }
          setFailOpen(true);
          setAppEnabled(failOpenOnError);
          return;
        }

        const raw = snapshot.get(PLATFORM_ACCESS.field);
        const parsed = parseAppEnabled(raw);

        if (parsed === null) {
          if (__DEV__) {
            console.warn('[PlatformAccess] app_enabled no es boolean:', raw);
          }
          setFailOpen(true);
          setAppEnabled(failOpenOnError);
          return;
        }

        setFailOpen(false);
        setAppEnabled(parsed);

        if (__DEV__) {
          console.log('[PlatformAccess] app_enabled =', parsed);
        }
      },
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (__DEV__) {
          console.error('[PlatformAccess] Error Firestore (¿reglas?):', message);
        }
        setFirestoreError(message);
        setFailOpen(true);
        setAppEnabled(failOpenOnError);
      },
    );

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({ appEnabled, failOpen, firestoreError }),
    [appEnabled, failOpen, firestoreError],
  );

  return (
    <PlatformAccessContext.Provider value={value}>{children}</PlatformAccessContext.Provider>
  );
}

export function usePlatformAccess(): PlatformAccessState {
  return useContext(PlatformAccessContext);
}
