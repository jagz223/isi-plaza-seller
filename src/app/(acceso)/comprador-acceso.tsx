import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OdonticaDecor } from '@/components/odontica';
import { Brand } from '@/constants/brand';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  DEFAULT_WHATSAPP_DIAL_CODE,
  formatWhatsapp,
} from '@/constants/location-data';
import { useAppMode } from '@/contexts/AppModeContext';
import { useConsumerAuth } from '@/contexts/ConsumerAuthContext';

const MAX_WHATSAPP_DIGITS = 12;

function validateAccessForm(name: string, number: string): string | null {
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
  return null;
}

export default function CompradorAccesoScreen() {
  const router = useRouter();
  const { setAppMode } = useAppMode();
  const { isAuthenticated, isLoading, registerGuest } = useConsumerAuth();

  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void setAppMode('comprador').then(() => router.replace('/(buyer)/buscar'));
    }
  }, [isAuthenticated, isLoading, router, setAppMode]);

  const handleContinue = async () => {
    const validationError = validateAccessForm(name, whatsappNumber);
    if (validationError) {
      Alert.alert('Validación', validationError);
      return;
    }

    const whatsapp = formatWhatsapp(DEFAULT_WHATSAPP_DIAL_CODE, whatsappNumber);
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
      <StatusBar style="dark" />
      <OdonticaDecor />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.center}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{Brand.patientAccessTitle}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor={IsiPlazaColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Whatsapp</Text>
                <View style={styles.whatsappRow}>
                  <Text style={styles.dialCode}>{DEFAULT_WHATSAPP_DIAL_CODE}</Text>
                  <TextInput
                    style={[styles.input, styles.whatsappInput]}
                    placeholder="Número"
                    placeholderTextColor={IsiPlazaColors.textSecondary}
                    value={whatsappNumber}
                    onChangeText={(text) => setWhatsappNumber(text.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={MAX_WHATSAPP_DIGITS}
                    editable={!loading}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitPressed,
                  loading && styles.submitDisabled,
                ]}
                onPress={() => void handleContinue()}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Acceder">
                <Text style={styles.submitLabel}>{loading ? 'Entrando…' : 'Acceder'}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.replace('/(acceso)/acceso-modo')}
              disabled={loading}
              style={styles.backLink}
              accessibilityRole="button">
              <Text style={styles.backLabel}>Volver</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingVertical: IsiPlazaSpacing.xl,
  },
  center: {
    gap: IsiPlazaSpacing.lg,
  },
  card: {
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.lg + 4,
    padding: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.md,
    shadowColor: IsiPlazaColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: IsiPlazaColors.white,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: IsiPlazaSpacing.sm,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.white,
  },
  input: {
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: IsiPlazaColors.text,
  },
  whatsappRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IsiPlazaSpacing.sm,
  },
  dialCode: {
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    minWidth: 56,
    textAlign: 'center',
  },
  whatsappInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: IsiPlazaSpacing.sm,
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitPressed: {
    opacity: 0.9,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
  },
  backLink: {
    alignSelf: 'center',
    padding: IsiPlazaSpacing.sm,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    textDecorationLine: 'underline',
  },
});
