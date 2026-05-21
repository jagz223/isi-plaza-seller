import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { IsiScreen, LoadingOverlay, MetricCard } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { fetchMetrics } from '@/services/api/seller';
import type { MetricsResponse } from '@/types/seller-api';

export default function MetricasScreen() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !metrics) {
    return <LoadingOverlay />;
  }

  return (
    <IsiScreen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Métricas de tu perfil en la aplicación de usuarios</Text>

      <MetricCard
        label="Usuarios que han clickeado tu perfil el último mes"
        value={metrics?.profile_views_count ?? 0}
      />
      <MetricCard
        label="Usuarios que han clickeado tu whatsapp último mes"
        value={metrics?.whatsapp_clicks_count ?? 0}
      />

      {metrics?.period_label ? (
        <Text style={styles.period}>Periodo: {metrics.period_label}</Text>
      ) : null}
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.xl,
    gap: IsiPlazaSpacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    textAlign: 'right',
    lineHeight: 24,
  },
  period: {
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
});
