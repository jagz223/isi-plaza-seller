import { useLocalSearchParams, type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyerMedicosSearchHeader } from '@/components/buyer/BuyerMedicosSearchHeader';
import { SellerListCard } from '@/components/buyer/SellerListCard';
import { OdonticaDecor } from '@/components/odontica';
import { type SelectOption } from '@/components/isi-plaza/SearchableSelect';
import { DEFAULT_SEARCH_RADIUS_KM, type GeoRegionKey } from '@/constants/geo-mexico';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  fetchConsumerBanners,
  fetchConsumerFilterMunicipalities,
  fetchConsumerSellers,
} from '@/services/api/consumer';
import type { ConsumerBanner, ConsumerSeller } from '@/types/consumer-api';
import { formatSellerLocationBlock } from '@/utils/format-seller-location';
import { getCurrentCoordinates } from '@/utils/location';

const HORIZONTAL_PAD = IsiPlazaSpacing.md;

function sellerMatchesQuery(seller: ConsumerSeller, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  const haystack = [
    seller.name,
    seller.professional_license,
    seller.address,
    seller.municipality,
    formatSellerLocationBlock(seller),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export default function MedicosIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = screenWidth - HORIZONTAL_PAD * 2;
  const params = useLocalSearchParams<{
    category?: string;
    categoryName?: string;
    treatment?: string;
    treatmentName?: string;
    sectionName?: string;
    near?: string;
    lat?: string;
    lng?: string;
  }>();

  const treatmentId = params.treatment ? Number(params.treatment) : null;
  const categoryId = params.category ? Number(params.category) : null;
  const isGeoMode = params.near === '1' || (Boolean(params.lat) && Boolean(params.lng));
  const geoLatitude = params.lat ? Number(params.lat) : null;
  const geoLongitude = params.lng ? Number(params.lng) : null;
  const hasValidGeo =
    geoLatitude != null &&
    !Number.isNaN(geoLatitude) &&
    geoLongitude != null &&
    !Number.isNaN(geoLongitude);

  const [banners, setBanners] = useState<ConsumerBanner[]>([]);
  const [sellers, setSellers] = useState<ConsumerSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedRegion, setSelectedRegion] = useState<GeoRegionKey | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [municipalityOptions, setMunicipalityOptions] = useState<SelectOption[]>([]);

  const canLoadSellers =
    isGeoMode ||
    (treatmentId != null && !Number.isNaN(treatmentId)) ||
    (categoryId != null && !Number.isNaN(categoryId));

  const displayBanners = useMemo(
    () =>
      [...banners].sort((a, b) => {
        if (b.sort_order !== a.sort_order) {
          return b.sort_order - a.sort_order;
        }
        return b.id - a.id;
      }),
    [banners],
  );

  const loadSellers = useCallback(async () => {
    if (!canLoadSellers) {
      setSellers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await fetchConsumerSellers({
        treatmentId: treatmentId ?? undefined,
        businessCategoryId: categoryId ?? undefined,
        country: 'México',
        region: selectedRegion ?? undefined,
        municipality: selectedMunicipality ?? undefined,
        latitude: hasValidGeo ? geoLatitude : undefined,
        longitude: hasValidGeo ? geoLongitude : undefined,
        radiusKm: hasValidGeo ? DEFAULT_SEARCH_RADIUS_KM : undefined,
      });
      setSellers(list);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudieron cargar los médicos.');
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [
    canLoadSellers,
    categoryId,
    geoLatitude,
    geoLongitude,
    hasValidGeo,
    selectedMunicipality,
    selectedRegion,
    treatmentId,
  ]);

  useEffect(() => {
    void fetchConsumerBanners(categoryId ?? undefined)
      .then(setBanners)
      .catch(() => setBanners([]));
  }, [categoryId]);

  useEffect(() => {
    void loadSellers();
  }, [loadSellers]);

  useEffect(() => {
    if (!selectedRegion) {
      setMunicipalityOptions([]);
      return;
    }
    void fetchConsumerFilterMunicipalities(selectedRegion)
      .then((list) => setMunicipalityOptions(list.map((m) => ({ value: m, label: m }))))
      .catch(() => setMunicipalityOptions([]));
  }, [selectedRegion]);

  const displaySellers = useMemo(() => {
    let list = [...sellers];

    if (isGeoMode) {
      list.sort((a, b) => {
        const distA = a.distance_km ?? Number.POSITIVE_INFINITY;
        const distB = b.distance_km ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }

    return list.filter((seller) => sellerMatchesQuery(seller, searchQuery));
  }, [isGeoMode, searchQuery, sellers]);

  const handleNearMe = useCallback(async () => {
    setLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) {
        return;
      }

      const treatmentPart =
        treatmentId != null && !Number.isNaN(treatmentId)
          ? `&treatment=${treatmentId}&treatmentName=${encodeURIComponent(String(params.treatmentName ?? 'Tratamiento'))}`
          : '';

      router.replace(
        `/(buyer)/medicos?near=1&lat=${coords.latitude}&lng=${coords.longitude}${treatmentPart}` as Href,
      );
    } finally {
      setLocating(false);
    }
  }, [params.treatmentName, router, treatmentId]);

  const handleRegionPress = useCallback((region: GeoRegionKey) => {
    setSelectedRegion((current) => (current === region ? null : region));
    setSelectedMunicipality(null);
  }, []);

  const handleBannerPress = useCallback(
    (banner: ConsumerBanner) => {
      if (banner.treatment_id) {
        const geoPart =
          hasValidGeo && geoLatitude != null && geoLongitude != null
            ? `&near=1&lat=${geoLatitude}&lng=${geoLongitude}`
            : '';
        router.push(
          `/(buyer)/medicos?treatment=${banner.treatment_id}&treatmentName=${encodeURIComponent(banner.treatment_name ?? 'Tratamiento')}${geoPart}` as Href,
        );
        return;
      }
      if (banner.link_url?.trim()) {
        void import('expo-linking').then(({ default: Linking }) =>
          Linking.openURL(banner.link_url!.trim()),
        );
      }
    },
    [geoLatitude, geoLongitude, hasValidGeo, router],
  );

  if (!canLoadSellers) {
    return (
      <View style={styles.root}>
        <View style={[styles.emptyCategoryBox, { paddingTop: insets.top + IsiPlazaSpacing.lg }]}>
          <Text style={styles.emptyCategoryText}>
            Selecciona un tratamiento o usa &quot;Buscar dentistas cerca de mí&quot; en Inicio.
          </Text>
          <Pressable onPress={() => router.push('/(buyer)/buscar')}>
            <Text style={styles.retryText}>Ir a Inicio</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <OdonticaDecor />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + IsiPlazaSpacing.sm,
          paddingBottom: insets.bottom + 88,
          paddingHorizontal: HORIZONTAL_PAD,
        }}
        showsVerticalScrollIndicator={false}>
        <BuyerMedicosSearchHeader
          banners={displayBanners}
          bannerWidth={bannerWidth}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            params.treatmentName
              ? `Buscar en ${decodeURIComponent(String(params.treatmentName))}`
              : 'Buscar tratamiento o dentista'
          }
          onNearMe={() => void handleNearMe()}
          locating={locating}
          selectedRegion={selectedRegion}
          onRegionPress={handleRegionPress}
          selectedMunicipality={selectedMunicipality}
          onMunicipalityChange={setSelectedMunicipality}
          municipalityOptions={municipalityOptions}
          onBannerPress={handleBannerPress}
          showBack
          onBack={() => router.push('/(buyer)/buscar')}
        />

        {loading ? (
          <ActivityIndicator color={IsiPlazaColors.primary} style={styles.loader} size="large" />
        ) : error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadSellers()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : displaySellers.length === 0 ? (
          <Text style={styles.sectionEmpty}>
            {isGeoMode
              ? `No hay médicos dentro de ${DEFAULT_SEARCH_RADIUS_KM} km con los filtros seleccionados.`
              : 'No hay médicos que coincidan con tu búsqueda.'}
          </Text>
        ) : (
          <View style={styles.list}>
            {displaySellers.map((seller) => (
              <SellerListCard
                key={seller.id}
                seller={seller}
                onPress={() => router.push(`/(buyer)/medicos/${seller.id}` as Href)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  scroll: {
    flex: 1,
  },
  loader: {
    marginTop: 32,
  },
  messageBox: {
    marginTop: 24,
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
    fontWeight: '700',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
  },
  sectionEmpty: {
    marginTop: 24,
    fontSize: 14,
    fontStyle: 'italic',
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  list: {
    marginTop: IsiPlazaSpacing.lg,
    gap: 14,
  },
  emptyCategoryBox: {
    flex: 1,
    justifyContent: 'center',
    padding: IsiPlazaSpacing.lg,
    gap: 16,
  },
  emptyCategoryText: {
    fontSize: 15,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
});
