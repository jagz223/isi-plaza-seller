import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { IsiButton, IsiHeader, IsiInput, IsiScreen } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, formatValidationErrors, getFieldError } from '@/services/api/errors';
import { userHasAccess } from '@/services/api/seller';

function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 14) {
    return 'La contraseña debe tener entre 6 y 14 caracteres.';
  }
  return null;
}

export default function RegistroScreen() {
  const { isAuthenticated, hasAccess, register, login } = useAuth();

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(hasAccess ? Routes.perfil : Routes.suscripcion);
    }
  }, [isAuthenticated, hasAccess]);

  const handleRegister = async () => {
    const pwdError = validatePassword(regPassword);
    if (pwdError) {
      Alert.alert('Validación', pwdError);
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      Alert.alert('Validación', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        password_confirmation: regPasswordConfirm,
      });
      router.replace(userHasAccess(user) ? Routes.perfil : Routes.suscripcion);
    } catch (e: unknown) {
      const message =
        e instanceof ApiError
          ? formatValidationErrors(e.validationErrors) || e.message
          : 'Intenta de nuevo.';
      Alert.alert('Error al registrarse', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      router.replace(userHasAccess(user) ? Routes.perfil : Routes.suscripcion);
    } catch (e: unknown) {
      const message =
        e instanceof ApiError
          ? getFieldError(e.validationErrors, 'email') || e.message
          : 'Credenciales incorrectas.';
      Alert.alert('Error al iniciar sesión', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim() || regEmail.trim();
    if (!email) {
      Alert.alert('Correo requerido', 'Ingresa tu correo en el formulario de inicio de sesión.');
      return;
    }
    setLoading(true);
    try {
      const { forgotPassword } = await import('@/services/api/seller');
      const res = await forgotPassword(email);
      Alert.alert('Recuperar contraseña', res.message);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo enviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <IsiHeader variant="access" showBack={true} />
      <IsiScreen contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.heading}>Registro médico</Text>
          <Text style={styles.subheading}>Crea tu cuenta para publicar tu consultorio en Odontica.</Text>

          <View style={styles.section}>
          <IsiInput label="Nombre" placeholder="Tu nombre o empresa" value={regName} onChangeText={setRegName} />
          <IsiInput
            label="Mail"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={regEmail}
            onChangeText={setRegEmail}
          />
          <IsiInput
            label="Contraseña (6-14 caracteres)"
            placeholder="••••••••"
            secureTextEntry
            value={regPassword}
            onChangeText={setRegPassword}
          />
          <IsiInput
            label="Volver a escribir contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={regPasswordConfirm}
            onChangeText={setRegPasswordConfirm}
          />
            <IsiButton label="Registrarme" onPress={handleRegister} disabled={loading} style={styles.mainButton} />
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>¿Ya tienes cuenta?</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Inicia sesión</Text>
          <View style={styles.section}>
          <IsiInput
            label="Correo"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={loginEmail}
            onChangeText={setLoginEmail}
          />
          <IsiInput
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
          />
          <IsiButton label="Iniciar Sesión" onPress={handleLogin} disabled={loading} style={styles.mainButton} />
          <IsiButton
            label="¿Olvidaste tu contraseña?"
            variant="ghost"
            onPress={handleForgotPassword}
            disabled={loading}
          />
          </View>
        </View>
      </IsiScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.xl,
    paddingBottom: IsiPlazaSpacing.xxl,
    gap: IsiPlazaSpacing.lg,
  },
  card: {
    backgroundColor: IsiPlazaColors.white,
    padding: IsiPlazaSpacing.xl,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
    marginBottom: IsiPlazaSpacing.xs,
  },
  subheading: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
    marginBottom: IsiPlazaSpacing.xl,
  },
  section: {
    gap: IsiPlazaSpacing.md,
  },
  mainButton: {
    marginTop: IsiPlazaSpacing.sm,
    borderRadius: 12,
    paddingVertical: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IsiPlazaSpacing.md,
    marginVertical: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: IsiPlazaColors.border,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.textSecondary,
  },
});
