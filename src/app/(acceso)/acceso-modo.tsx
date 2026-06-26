import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OdonticaDecor, OdonticaLogo } from '@/components/odontica';
import { TermsAndConditionsModal } from '@/components/isi-plaza/TermsAndConditionsModal';
import { Brand } from '@/constants/brand';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAppMode } from '@/contexts/AppModeContext';

export default function AccesoModoScreen() {
  const router = useRouter();
  const { setAppMode } = useAppMode();
  const [termsVisible, setTermsVisible] = useState(false);

  const handlePaciente = () => {
    router.replace('/(acceso)/comprador-acceso');
  };

  const handleMedico = async () => {
    await setAppMode('mayorista');
    router.replace('/(auth)/registro');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <OdonticaDecor />

      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <OdonticaLogo />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.modeButtonOutline, pressed && styles.pressed]}
            onPress={handlePaciente}
            accessibilityRole="button"
            accessibilityLabel={Brand.patientRole}>
            <View style={styles.iconBoxPrimary}>
              <Ionicons name="search" size={28} color={IsiPlazaColors.white} />
            </View>
            <View style={styles.buttonTextCol}>
              <Text style={styles.titleDark}>{Brand.patientRole}</Text>
              <Text style={styles.subtitleDark}>{Brand.patientSubtitle}</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.modeButtonFilled, pressed && styles.pressedFilled]}
            onPress={() => void handleMedico()}
            accessibilityRole="button"
            accessibilityLabel={Brand.doctorRole}>
            <View style={styles.iconBoxLight}>
              <MaterialCommunityIcons name="doctor" size={28} color={IsiPlazaColors.white} />
            </View>
            <View style={styles.buttonTextCol}>
              <Text style={styles.titleLight}>{Brand.doctorRole}</Text>
              <Text style={styles.subtitleLight}>{Brand.doctorSubtitle}</Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setTermsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Ver términos y condiciones">
          <Text style={styles.terms}>Términos y condiciones de la app</Text>
        </Pressable>
      </View>

      <TermsAndConditionsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: IsiPlazaSpacing.lg,
    justifyContent: 'space-between',
    paddingBottom: IsiPlazaSpacing.md,
  },
  brandBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: IsiPlazaSpacing.xl,
  },
  buttons: {
    gap: IsiPlazaSpacing.lg,
    paddingBottom: IsiPlazaSpacing.xl,
  },
  modeButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.white,
    borderRadius: 20,
    paddingVertical: IsiPlazaSpacing.lg,
    paddingHorizontal: IsiPlazaSpacing.lg,
    minHeight: 96,
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
    minHeight: 96,
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
  iconBoxPrimary: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: IsiPlazaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLight: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: IsiPlazaColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextCol: {
    flex: 1,
    gap: 4,
  },
  titleDark: {
    fontSize: 18,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    letterSpacing: 0.5,
  },
  titleLight: {
    fontSize: 18,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    letterSpacing: 0.5,
  },
  subtitleDark: {
    fontSize: 13,
    fontWeight: '500',
    color: IsiPlazaColors.textSecondary,
  },
  subtitleLight: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  terms: {
    fontSize: 13,
    color: IsiPlazaColors.primary,
    textAlign: 'center',
    paddingVertical: IsiPlazaSpacing.md,
    textDecorationLine: 'underline',
  },
});
