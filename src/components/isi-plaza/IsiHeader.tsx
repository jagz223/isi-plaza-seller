import { StyleSheet, View, Text, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';

import { OdonticaLogo } from '@/components/odontica';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { Routes } from '@/constants/routes';

type IsiHeaderProps = {
  compact?: boolean;
  /** access = logo sobre navy; admin = tarjeta blanca */
  variant?: 'access' | 'admin';
  title?: string;
  showBack?: boolean;
  /** Si no hay historial (p. ej. llegó con replace), navegar aquí en lugar de router.back() */
  backFallbackHref?: Href;
};

export function IsiHeader({
  compact = false,
  variant = 'access',
  title,
  showBack = false,
  backFallbackHref = Routes.accesoModo,
}: IsiHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (backFallbackHref) {
      router.replace(backFallbackHref);
    }
  };

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, title && styles.wrapperWithTitle]}>
      <View style={[styles.curve, compact && styles.curveCompact]} />

      {showBack && (
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={variant === 'access' ? IsiPlazaColors.white : IsiPlazaColors.text}
          />
        </Pressable>
      )}

      {title ? (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : (
        <View style={styles.logoContainer}>
          {variant === 'access' ? (
            <OdonticaLogo variant="light" compact={compact} />
          ) : (
            <View style={[styles.logoCard, compact && styles.logoCardCompact]}>
              <OdonticaLogo compact={compact} showTagline={!compact} />
            </View>
          )}
        </View>
      )}
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
  wrapperWithTitle: {
    height: 120,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: IsiPlazaSpacing.xl,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: IsiPlazaColors.white,
  },
  backButton: {
    position: 'absolute',
    top: IsiPlazaSpacing.xl + 10,
    left: IsiPlazaSpacing.md,
    zIndex: 10,
    padding: 8,
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
});
