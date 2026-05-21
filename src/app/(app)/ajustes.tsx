import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { IsiButton, IsiInput, IsiScreen, IsiSectionTitle, LoadingOverlay } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAuth } from '@/contexts/AuthContext';
import { formatValidationErrors } from '@/services/api/errors';
import { fetchSettings, patchPassword } from '@/services/api/seller';
import type { SettingsResponse } from '@/types/seller-api';

function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 14) {
    return 'La contraseña debe tener entre 6 y 14 caracteres.';
  }
  return null;
}

export default function AjustesScreen() {
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
      load();
    }, [load]),
  );

  const openPromotionWhatsApp = () => {
    if (!settings?.promotion_whatsapp_url) {
      Alert.alert('Error', 'URL de promoción no disponible.');
      return;
    }
    Linking.openURL(settings.promotion_whatsapp_url);
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
    ? `Tu suscripción acaba el día ${settings.subscription_expires_at_formatted}`
    : 'Tu suscripción no tiene fecha de vencimiento registrada.';

  return (
    <IsiScreen contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Opciones De Tu Cuenta</Text>

      <View style={styles.subscriptionCard}>
        <Text style={styles.subscriptionText}>{expiresText}</Text>
      </View>

      <IsiButton label="Comprar promoción (banners)" onPress={openPromotionWhatsApp} />

      <IsiSectionTitle>Cambiar contraseña</IsiSectionTitle>
      <View style={styles.fields}>
        <IsiInput
          label="Contraseña actual"
          placeholder="••••••••"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <IsiInput
          label="Nueva contraseña (6-14 caracteres)"
          placeholder="••••••••"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <IsiInput
          label="Confirmar nueva contraseña"
          placeholder="••••••••"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <IsiButton label="Actualizar contraseña" variant="outline" onPress={handleChangePassword} disabled={saving} />
      </View>

      <View style={styles.logoutSection}>
        <IsiButton label="Cerrar sesión" variant="outline" onPress={signOut} />
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.xl,
    gap: IsiPlazaSpacing.lg,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  subscriptionCard: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderLeftWidth: 4,
    borderLeftColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.sm,
    padding: IsiPlazaSpacing.md,
  },
  subscriptionText: {
    fontSize: 15,
    color: IsiPlazaColors.text,
    lineHeight: 22,
  },
  fields: {
    gap: IsiPlazaSpacing.md,
  },
  logoutSection: {
    marginTop: IsiPlazaSpacing.md,
    marginBottom: IsiPlazaSpacing.xl,
  },
});
