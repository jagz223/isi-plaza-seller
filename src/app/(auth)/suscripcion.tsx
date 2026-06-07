import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { IsiButton, IsiHeader, IsiScreen, LoadingOverlay } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSubscription } from '@/services/api/seller';
import type { SubscriptionResponse } from '@/types/seller-api';

export default function SuscripcionScreen() {
  const { hasAccess, refreshSession, signOut } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    try {
      const data = await fetchSubscription();
      setSubscription(data);
      if (data.can_access_app) {
        await refreshSession();
        router.replace(Routes.perfil);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo cargar la suscripción.');
    } finally {
      setLoading(false);
    }
  }, [refreshSession]);

  useFocusEffect(
    useCallback(() => {
      if (hasAccess) {
        router.replace(Routes.perfil);
        return;
      }
      setLoading(true);
      loadSubscription();
    }, [hasAccess, loadSubscription]),
  );

  const openWhatsApp = () => {
    if (!subscription?.whatsapp_payment_url) {
      Alert.alert('Error', 'URL de WhatsApp no disponible.');
      return;
    }
    Linking.openURL(subscription.whatsapp_payment_url);
  };

  if (loading && !subscription) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.root}>
      <IsiHeader variant="access" compact />
      <IsiScreen contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.priceLabel}>
            {subscription?.subscription_plan_label ?? 'Plan mayorista'}
          </Text>
          <Text style={styles.price}>
            {subscription?.subscription_price_label ?? 'Suscripción mensual de 69 MXN'}
          </Text>
          {subscription?.message ? <Text style={styles.hint}>{subscription.message}</Text> : null}
          <IsiButton
            label={subscription?.subscribe_button_label ?? 'Suscribirme'}
            onPress={openWhatsApp}
          />
        </View>

        <View style={styles.blockedCard}>
          <Text style={styles.blockedTitle}>Acceso pendiente</Text>
          <Text style={styles.blockedText}>
            Hasta que el administrador active tu cuenta, no podrás acceder a Dar de alta, Métricas ni
            Ajustes. Estado actual: {subscription?.access_status ?? 'pending'}.
          </Text>
        </View>

        <IsiButton label="Actualizar estado" variant="outline" onPress={loadSubscription} />
        <IsiButton label="Cerrar sesión" variant="ghost" onPress={signOut} />
      </IsiScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.xl,
    gap: IsiPlazaSpacing.lg,
  },
  card: {
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.lg,
    padding: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.md,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: IsiPlazaColors.primary,
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  blockedCard: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderRadius: IsiPlazaRadius.md,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.sm,
  },
  blockedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: IsiPlazaColors.text,
  },
  blockedText: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 20,
  },
});
