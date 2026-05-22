import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { usePlatformAccess } from '@/contexts/PlatformAccessContext';

export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { appEnabled } = usePlatformAccess();

  const blocked = appEnabled === null || appEnabled === false;

  if (blocked) {
    return <View style={styles.overlay} accessibilityLabel="Plataforma no disponible" />;
  }

  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          zIndex: 2147483647,
        } as object)
      : StyleSheet.absoluteFillObject),
  },
});
