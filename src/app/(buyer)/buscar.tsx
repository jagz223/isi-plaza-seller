import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConsumerBannerCarousel } from '@/components/buyer/ConsumerBannerCarousel';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { fetchConsumerBanners, fetchConsumerSettings, fetchConsumerTreatments } from '@/services/api/consumer';
import type { ConsumerBanner, TreatmentSection } from '@/types/consumer-api';
import { getCurrentCoordinates } from '@/utils/location';

export default function BuscarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = screenWidth - IsiPlazaSpacing.md * 2;
  const [sections, setSections] = useState<TreatmentSection[]>([]);
  const [banners, setBanners] = useState<ConsumerBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsumerTreatments();
      setSections(data);
      const bannerList = await fetchConsumerBanners().catch(() => []);
      setBanners(bannerList);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudieron cargar los tratamientos.');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void fetchConsumerSettings()
      .then((s) => setCompliance(s.external_contact_disclaimer))
      .catch(() => setCompliance(null));
  }, []);

  const flatTreatments = useMemo(
    () =>
      sections.flatMap((section) =>
        section.treatments.map((treatment) => ({
          ...treatment,
          sectionName: section.name,
        })),
      ),
    [sections],
  );

  const handleNearMe = useCallback(async () => {
    setLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        return;
      }
      router.push(
        `/(buyer)/medicos?near=1&lat=${coords.latitude}&lng=${coords.longitude}` as Href,
      );
    } finally {
      setLocating(false);
    }
  }, [router]);

  const handleBannerPress = useCallback(
    (banner: ConsumerBanner) => {
      if (banner.treatment_id) {
        router.push(
          `/(buyer)/medicos?treatment=${banner.treatment_id}&treatmentName=${encodeURIComponent(banner.treatment_name ?? 'Tratamiento')}` as Href,
        );
        return;
      }
      if (banner.link_url?.trim()) {
        void import('expo-linking').then(({ default: Linking }) => Linking.openURL(banner.link_url!.trim()));
      }
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
        <Text style={styles.headerTitle}>¿Qué tratamiento buscas?</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {banners.length > 0 ? (
          <View style={styles.bannerSection}>
            <ConsumerBannerCarousel
              banners={banners}
              width={bannerWidth}
              onBannerPress={handleBannerPress}
            />
          </View>
        ) : null}

        <View style={styles.nearMeSection}>
          <TouchableOpacity
            style={styles.nearMeButton}
            activeOpacity={0.85}
            disabled={locating}
            onPress={() => void handleNearMe()}>
            {locating ? (
              <ActivityIndicator color={IsiPlazaColors.white} />
            ) : (
              <Text style={styles.nearMeButtonText}>Buscar dentistas cerca de mí</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={IsiPlazaColors.primary} style={styles.loader} />
        )}

        {!loading && error && (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && flatTreatments.length === 0 && (
          <Text style={styles.emptyText}>
            No hay tratamientos disponibles. Configúralos en el panel administrativo.
          </Text>
        )}

        {!loading &&
          !error &&
          sections.map((section) => (
            <View key={section.id} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <View style={styles.treatmentGrid}>
                {section.treatments.map((treatment) => (
                  <TouchableOpacity
                    key={treatment.id}
                    style={styles.treatmentCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push(
                        `/(buyer)/medicos?treatment=${treatment.id}&treatmentName=${encodeURIComponent(treatment.name)}&sectionName=${encodeURIComponent(section.name)}` as Href,
                      )
                    }>
                    <Text style={styles.treatmentText}>{treatment.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        {compliance ? (
          <Text style={styles.compliance}>{compliance}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  header: {
    backgroundColor: IsiPlazaColors.primary,
    paddingBottom: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: IsiPlazaSpacing.xl,
  },
  bannerSection: {
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingTop: IsiPlazaSpacing.md,
  },
  nearMeSection: {
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingTop: IsiPlazaSpacing.lg,
  },
  nearMeButton: {
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  nearMeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  loader: {
    marginTop: 48,
  },
  messageBox: {
    marginTop: 32,
    paddingHorizontal: IsiPlazaSpacing.lg,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
  },
  emptyText: {
    marginTop: 32,
    paddingHorizontal: IsiPlazaSpacing.lg,
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  sectionBlock: {
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingTop: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
    textTransform: 'uppercase',
  },
  treatmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  treatmentCard: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
  },
  treatmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  compliance: {
    marginTop: IsiPlazaSpacing.xl,
    marginHorizontal: IsiPlazaSpacing.lg,
    fontSize: 12,
    lineHeight: 18,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
});
