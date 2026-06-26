import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DoctorFieldCard, DoctorSaveButton } from '@/components/doctor';
import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';
import { IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAuth } from '@/contexts/AuthContext';
import { formatValidationErrors } from '@/services/api/errors';
import { fetchSettings, patchPassword } from '@/services/api/seller';
import type { SettingsResponse } from '@/types/seller-api';
import { LoadingOverlay } from '@/components/isi-plaza';

function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 14) {
    return 'La contraseña debe tener entre 6 y 14 caracteres.';
  }
  return null;
}

export default function AjustesScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudieron cargar los ajustes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openRenewalWhatsApp = () => {
    const url = settings?.promotion_whatsapp_url;
    if (!url) {
      Alert.alert('Error', 'URL de WhatsApp no disponible.');
      return;
    }
    Linking.openURL(url);
  };

  const handleChangePassword = async () => {
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      Alert.alert('Validación', pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validación', 'Las contraseñas nuevas no coinciden.');
      return;
    }

    setSaving(true);
    try {
      const res = await patchPassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      Alert.alert('Éxito', res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const err = e as { validationErrors?: Record<string, string[]>; message?: string };
      Alert.alert(
        'Error',
        formatValidationErrors(err.validationErrors) || err.message || 'No se pudo actualizar.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <LoadingOverlay />;
  }

  const expiresText = settings?.subscription_expires_at_formatted
    ? `TU SUSCRIPCIÓN TERMINA EL ${settings.subscription_expires_at_formatted.toUpperCase()}`
    : 'TU SUSCRIPCIÓN NO TIENE FECHA DE VENCIMIENTO REGISTRADA';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CUENTA</Text>
        <Pressable style={styles.backBtn} onPress={() => router.push('/(app)/perfil')}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subscriptionLine}>{expiresText}</Text>

        <View style={styles.renewalBox}>
          <Text style={styles.renewalText}>
            CONTACTAR AL VENDEDOR PARA RENOVAR SUSCRIPCIÓN O ADQUIRIR PROMOCIÓN DE BANNER
          </Text>
          <Pressable style={styles.whatsappBtn} onPress={openRenewalWhatsApp}>
            <Text style={styles.whatsappBtnText}>ENVIAR WHATSAPP</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>CAMBIAR CONTRASEÑA</Text>

        <View style={styles.passwordPanel}>
          <DoctorFieldCard label="Contraseña actual">
            <TextInput
              style={styles.fieldInput}
              placeholder="Tu contraseña actual"
              placeholderTextColor={DoctorUIColors.textMuted}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </DoctorFieldCard>

          <DoctorFieldCard label="Nueva contraseña">
            <TextInput
              style={styles.fieldInput}
              placeholder="6 a 14 caracteres"
              placeholderTextColor={DoctorUIColors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </DoctorFieldCard>

          <DoctorFieldCard label="Confirmación">
            <TextInput
              style={styles.fieldInput}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor={DoctorUIColors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </DoctorFieldCard>

          <DoctorSaveButton
            label="Actualizar contraseña"
            onPress={() => void handleChangePassword()}
            disabled={saving}
            loading={saving}
          />
        </View>

        <Pressable style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DoctorUIColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.sm,
    paddingBottom: IsiPlazaSpacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DoctorUIColors.text,
    letterSpacing: 0.5,
  },
  backBtn: {
    backgroundColor: DoctorUIColors.panel,
    borderRadius: DoctorUIRadius.button,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: DoctorUIColors.primary,
  },
  scrollContent: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingBottom: IsiPlazaSpacing.xl,
    gap: IsiPlazaSpacing.lg,
  },
  subscriptionLine: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: DoctorUIColors.primary,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  renewalBox: {
    borderWidth: 1.5,
    borderColor: DoctorUIColors.primary,
    borderRadius: DoctorUIRadius.card,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
    alignItems: 'center',
  },
  renewalText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: DoctorUIColors.primary,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  whatsappBtn: {
    backgroundColor: DoctorUIColors.primary,
    borderRadius: DoctorUIRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  whatsappBtnText: {
    color: DoctorUIColors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DoctorUIColors.text,
    letterSpacing: 0.3,
  },
  passwordPanel: {
    backgroundColor: DoctorUIColors.panel,
    borderRadius: DoctorUIRadius.panel,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.sm,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '600',
    color: DoctorUIColors.primary,
    paddingVertical: 4,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: IsiPlazaSpacing.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: DoctorUIColors.primary,
    textDecorationLine: 'underline',
  },
});
