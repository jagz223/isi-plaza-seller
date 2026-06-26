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

import { BuyerMedicosSearchHeader } from '@/components/buyer/BuyerMedicosSearchHeader';
import { OdonticaDecor } from '@/components/odontica';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        treatments: section.treatments.filter(
          (treatment) =>
            treatment.name.toLowerCase().includes(q) || section.name.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.treatments.length > 0);
  }, [searchQuery, sections]);

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

  const handleTreatmentPress = useCallback(
    (treatmentId: number, treatmentName: string, sectionName: string) => {
      router.push(
        `/(buyer)/medicos?treatment=${treatmentId}&treatmentName=${encodeURIComponent(treatmentName)}&sectionName=${encodeURIComponent(sectionName)}` as Href,
      );
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <OdonticaDecor />

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingTop: insets.top + IsiPlazaSpacing.sm, paddingBottom: insets.bottom + 88 },
        ]}>
        <BuyerMedicosSearchHeader
          banners={banners}
          bannerWidth={bannerWidth}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar tratamiento"
          onNearMe={() => void handleNearMe()}
          locating={locating}
          selectedRegion={null}
          onRegionPress={() => {}}
          selectedMunicipality={null}
          onMunicipalityChange={() => {}}
          municipalityOptions={[]}
          onBannerPress={handleBannerPress}
          showRegionFilters={false}
        />

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

        {!loading && !error && filteredSections.length === 0 && (
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'No hay tratamientos que coincidan con tu búsqueda.'
              : 'No hay tratamientos disponibles. Configúralos en el panel administrativo.'}
          </Text>
        )}

        {!loading &&
          !error &&
          filteredSections.map((section) => (
            <View key={section.id} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <View style={styles.treatmentGrid}>
                {section.treatments.map((treatment) => (
                  <TouchableOpacity
                    key={treatment.id}
                    style={styles.treatmentCard}
                    activeOpacity={0.85}
                    onPress={() => handleTreatmentPress(treatment.id, treatment.name, section.name)}>
                    <Text style={styles.treatmentText}>{treatment.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

        {compliance ? <Text style={styles.compliance}>{compliance}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
  },
  loader: {
    marginTop: 24,
  },
  messageBox: {
    marginTop: 16,
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
    marginTop: 8,
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  sectionBlock: {
    paddingTop: IsiPlazaSpacing.sm,
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
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
  },
  treatmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  compliance: {
    marginTop: IsiPlazaSpacing.lg,
    fontSize: 12,
    lineHeight: 18,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
});
