import { Image } from 'expo-image';
import { StyleSheet, View, Text, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';

type IsiHeaderProps = {
  compact?: boolean;
  /** access = logo blanco sobre rojo (pantalla de registro); admin = tarjeta blanca (estilo panel) */
  variant?: 'access' | 'admin';
  title?: string;
  showBack?: boolean;
};

export function IsiHeader({ compact = false, variant = 'access', title, showBack = false }: IsiHeaderProps) {
  const router = useRouter();
  
  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, title && styles.wrapperWithTitle]}>
      <View style={[styles.curve, compact && styles.curveCompact]} />
      
      {showBack && (
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={variant === 'access' ? IsiPlazaColors.white : IsiPlazaColors.text} />
        </Pressable>
      )}

      {title ? (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : (
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
