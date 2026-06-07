import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';

type LoadingOverlayProps = {
  message?: string;
  /** Pantalla completa (carga inicial) o capa sobre el formulario al guardar */
  variant?: 'screen' | 'overlay';
};

export function LoadingOverlay({ message, variant = 'screen' }: LoadingOverlayProps) {
  return (
    <View style={[styles.container, variant === 'overlay' && styles.overlay]}>
      <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.background,
    gap: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
});
