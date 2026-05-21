import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';

type IsiHeaderProps = {
  compact?: boolean;
  /** access = logo blanco sobre rojo (pantalla de registro); admin = tarjeta blanca (estilo panel) */
  variant?: 'access' | 'admin';
};

export function IsiHeader({ compact = false, variant = 'access' }: IsiHeaderProps) {
  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <View style={[styles.curve, compact && styles.curveCompact]} />
      <View style={styles.logoContainer}>
        {variant === 'access' ? (
          <Image
            source={require('@/assets/images/splash-brand.jpg')}
            style={[styles.logoAccess, compact && styles.logoAccessCompact]}
            contentFit="contain"
          />
        ) : (
          <View style={[styles.logoCard, compact && styles.logoCardCompact]}>
            <Image
              source={require('@/assets/images/logo.jpeg')}
              style={[styles.logo, compact && styles.logoCompact]}
              contentFit="contain"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 220,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.background,
  },
  wrapperCompact: {
    height: 160,
  },
  curve: {
    position: 'absolute',
    top: 0,
    left: -40,
    right: -40,
    height: 200,
    backgroundColor: IsiPlazaColors.primary,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
  },
  curveCompact: {
    height: 140,
    borderBottomLeftRadius: 140,
    borderBottomRightRadius: 140,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: IsiPlazaSpacing.lg,
  },
  logoCard: {
    backgroundColor: IsiPlazaColors.white,
    borderRadius: 16,
    padding: IsiPlazaSpacing.md,
    shadowColor: IsiPlazaColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoCardCompact: {
    padding: IsiPlazaSpacing.sm,
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoCompact: {
    width: 72,
    height: 72,
  },
  logoAccess: {
    width: 160,
    height: 100,
  },
  logoAccessCompact: {
    width: 130,
    height: 80,
  },
});
