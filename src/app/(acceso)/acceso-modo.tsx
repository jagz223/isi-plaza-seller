import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAppMode } from '@/contexts/AppModeContext';

export default function AccesoModoScreen() {
  const router = useRouter();
  const { setAppMode } = useAppMode();

  const handleComprador = () => {
    router.replace('/(acceso)/comprador-acceso');
  };

  const handleMayorista = async () => {
    await setAppMode('mayorista');
    router.replace('/(auth)/registro');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerCurve} />
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/splash-brand.jpg')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.modeButtonOutline, pressed && styles.pressed]}
            onPress={handleComprador}
            accessibilityRole="button"
            accessibilityLabel="Busco Mayoristas">
            <View style={styles.iconBoxOutline}>
              <Ionicons name="search" size={36} color={IsiPlazaColors.primary} />
            </View>
            <View style={styles.buttonTextCol}>
              <Text style={styles.titleOutline}>Busco Mayoristas</Text>
              <View style={styles.pillOutline}>
                <Text style={styles.pillTextOutline}>cerca de tu ubicación</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.modeButtonFilled, pressed && styles.pressedFilled]}
            onPress={handleMayorista}
            accessibilityRole="button"
            accessibilityLabel="Soy Mayorista">
            <View style={styles.iconBoxFilled}>
              <Ionicons name="home-outline" size={36} color={IsiPlazaColors.white} />
            </View>
            <View style={styles.buttonTextCol}>
              <Text style={styles.titleFilled}>Soy Mayorista</Text>
              <View style={styles.pillFilled}>
                <Text style={styles.pillTextFilled}>directorio B2B premium</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <Text style={styles.terms}>Terminos y condiciones de la app</Text>
      </View>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 280;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.white,
  },
  headerCurve: {
    position: 'absolute',
    top: 0,
    left: -48,
    right: -48,
    height: HEADER_HEIGHT - 24,
    backgroundColor: IsiPlazaColors.primary,
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: IsiPlazaSpacing.lg,
    paddingBottom: IsiPlazaSpacing.xl,
  },
  logo: {
    width: 200,
    height: 120,
  },
  body: {
    flex: 1,
    paddingHorizontal: IsiPlazaSpacing.lg,
    justifyContent: 'space-between',
    paddingBottom: IsiPlazaSpacing.md,
  },
  buttons: {
    flex: 1,
    justifyContent: 'center',
    gap: IsiPlazaSpacing.lg,
    paddingVertical: IsiPlazaSpacing.xl,
  },
  modeButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 2,
    borderColor: IsiPlazaColors.primary,
    borderRadius: 20,
    paddingVertical: IsiPlazaSpacing.lg,
    paddingHorizontal: IsiPlazaSpacing.lg,
    minHeight: 110,
    gap: IsiPlazaSpacing.md,
    shadowColor: IsiPlazaColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  modeButtonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: 20,
    paddingVertical: IsiPlazaSpacing.lg,
    paddingHorizontal: IsiPlazaSpacing.lg,
    minHeight: 110,
    gap: IsiPlazaSpacing.md,
    shadowColor: IsiPlazaColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  pressedFilled: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  iconBoxOutline: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxFilled: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextCol: {
    flex: 1,
    alignItems: 'center',
    gap: IsiPlazaSpacing.sm,
  },
  titleOutline: {
    fontSize: 22,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
  },
  titleFilled: {
    fontSize: 22,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  pillOutline: {
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.pill,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: 6,
  },
  pillTextOutline: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
  },
  pillFilled: {
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.pill,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: 6,
  },
  pillTextFilled: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  terms: {
    fontSize: 13,
    color: IsiPlazaColors.text,
    textAlign: 'center',
    paddingVertical: IsiPlazaSpacing.md,
  },
});
