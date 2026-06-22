import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IsiButton, IsiInput, SearchableSelect } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  DEFAULT_WHATSAPP_DIAL_CODE,
  formatWhatsapp,
  getDialCodeOptions,
} from '@/constants/location-data';
import { useAppMode } from '@/contexts/AppModeContext';
import { useConsumerAuth } from '@/contexts/ConsumerAuthContext';

const MAX_WHATSAPP_DIGITS = 12;

function validateAccessForm(name: string, dialCode: string, number: string): string | null {
  if (!name.trim()) {
    return 'Ingresa tu nombre.';
  }
  const digits = number.replace(/\D/g, '');
  if (!digits.length) {
    return 'Ingresa tu número de WhatsApp.';
  }
  if (digits.length > MAX_WHATSAPP_DIGITS) {
    return `El número de WhatsApp no puede tener más de ${MAX_WHATSAPP_DIGITS} dígitos.`;
  }
  if (!dialCode.trim()) {
    return 'Selecciona el prefijo de tu país para WhatsApp.';
  }
  return null;
}

export default function CompradorAccesoScreen() {
  const router = useRouter();
  const { setAppMode } = useAppMode();
  const { isAuthenticated, isLoading, registerGuest } = useConsumerAuth();

  const [name, setName] = useState('');
  const [whatsappDialCode, setWhatsappDialCode] = useState(DEFAULT_WHATSAPP_DIAL_CODE);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void setAppMode('comprador').then(() => router.replace('/(buyer)/buscar'));
    }
  }, [isAuthenticated, isLoading, router, setAppMode]);

  const handleContinue = async () => {
    const validationError = validateAccessForm(name, whatsappDialCode, whatsappNumber);
    if (validationError) {
      Alert.alert('Validación', validationError);
      return;
    }

    const whatsapp = formatWhatsapp(whatsappDialCode, whatsappNumber);
    setLoading(true);
    try {
      await registerGuest(name.trim(), whatsapp);
      await setAppMode('comprador');
      router.replace('/(buyer)/buscar');
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('No se pudo continuar', err.message ?? 'Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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
            <Text style={styles.title}>Busco Mayoristas</Text>
            <Text style={styles.subtitle}>
              Déjanos tu nombre y WhatsApp para acceder al directorio.
            </Text>

            <View style={styles.form}>
              <IsiInput
                label="Nombre"
                placeholder="Tu nombre"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.fieldLabel}>WhatsApp</Text>
              <View style={styles.whatsappRow}>
                <View style={styles.dialCodeWrap}>
                  <SearchableSelect
                    label="Código"
                    placeholder="Prefijo"
                    options={getDialCodeOptions()}
                    value={whatsappDialCode}
                    onChange={setWhatsappDialCode}
                    disabled={loading}
                    compact
                  />
                </View>
                <View style={styles.numberWrap}>
                  <IsiInput
                    placeholder="Número"
                    value={whatsappNumber}
                    onChangeText={(text) => setWhatsappNumber(text.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={MAX_WHATSAPP_DIGITS}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            <IsiButton
              label={loading ? 'Entrando…' : 'Continuar'}
              onPress={() => void handleContinue()}
              disabled={loading}
            />

            <IsiButton
              label="Volver"
              variant="ghost"
              onPress={() => router.replace('/(acceso)/acceso-modo')}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 220;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    width: 180,
    height: 100,
  },
  body: {
    flex: 1,
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingBottom: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
    marginBottom: IsiPlazaSpacing.sm,
  },
  form: {
    gap: IsiPlazaSpacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IsiPlazaColors.text,
  },
  whatsappRow: {
    flexDirection: 'row',
    gap: IsiPlazaSpacing.sm,
    alignItems: 'flex-start',
  },
  dialCodeWrap: {
    width: 132,
  },
  numberWrap: {
    flex: 1,
  },
});
