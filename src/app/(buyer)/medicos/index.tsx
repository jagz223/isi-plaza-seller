import { useLocalSearchParams, type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { ConsumerBannerCarousel } from '@/components/buyer/ConsumerBannerCarousel';
import { SellerGridCard } from '@/components/buyer/SellerGridCard';
import { SearchableSelect, type SelectOption } from '@/components/isi-plaza/SearchableSelect';
import { DEFAULT_SEARCH_RADIUS_KM, GEO_REGIONS, type GeoRegionKey } from '@/constants/geo-mexico';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { getStatesForCountry } from '@/constants/location-data';
import {
  fetchConsumerBanners,
  fetchConsumerFilterCountries,
  fetchConsumerFilterMunicipalities,
  fetchConsumerFilterStates,
  fetchConsumerSellers,
} from '@/services/api/consumer';
import type { ConsumerBanner, ConsumerSeller } from '@/types/consumer-api';
import { buildSellerSections } from '@/utils/group-consumer-sellers';

const GRID_COLUMNS = 2;
const GRID_GAP = 10;
const HORIZONTAL_PAD = IsiPlazaSpacing.md;

export default function MayoristasIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - HORIZONTAL_PAD * 2;
  const cardWidth = Math.min(
    (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
    175,
  );
  const bannerWidth = contentWidth;
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

  const categoryTitle = isGeoMode
    ? 'Dentistas cerca de ti'
    : params.treatmentName
      ? decodeURIComponent(String(params.treatmentName))
      : params.categoryName
        ? decodeURIComponent(String(params.categoryName))
        : 'Médicos';

  const [banners, setBanners] = useState<ConsumerBanner[]>([]);
  const [sellers, setSellers] = useState<ConsumerSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>('México');
  const [selectedRegion, setSelectedRegion] = useState<GeoRegionKey | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [scrollToState, setScrollToState] = useState<string | null>(null);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [municipalityOptions, setMunicipalityOptions] = useState<SelectOption[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Record<string, number>>({});
  const pendingScrollStateRef = useRef<string | null>(null);

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
        country: selectedCountry ?? undefined,
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
    selectedCountry,
    selectedMunicipality,
    selectedRegion,
    treatmentId,
  ]);

  useEffect(() => {
    void fetchConsumerFilterCountries()
      .then((list) =>
        setCountryOptions(list.map((c) => ({ value: c.name, label: c.name }))),
      )
      .catch(() => setCountryOptions([]));
  }, []);

  useEffect(() => {
    void fetchConsumerBanners(categoryId ?? undefined)
      .then(setBanners)
      .catch(() => setBanners([]));
  }, [categoryId]);

  useEffect(() => {
    void loadSellers();
  }, [loadSellers]);

  useEffect(() => {
    if (canLoadSellers) {
      setSelectedCountry('México');
    }
  }, [canLoadSellers, categoryId, treatmentId]);

  useEffect(() => {
    if (!selectedCountry || isGeoMode) {
      setStateOptions([]);
      return;
    }
    void fetchConsumerFilterStates(selectedCountry)
      .then((states) => {
        const configured = getStatesForCountry(selectedCountry);
        const merged = [...new Set([...configured, ...states])].sort((a, b) =>
          a.localeCompare(b, 'es'),
        );
        setStateOptions(merged.map((s) => ({ value: s, label: s })));
      })
      .catch(() => {
        const configured = getStatesForCountry(selectedCountry);
        setStateOptions(configured.map((s) => ({ value: s, label: s })));
      });
  }, [isGeoMode, selectedCountry]);

  useEffect(() => {
    if (!selectedRegion) {
      setMunicipalityOptions([]);
      return;
    }
    void fetchConsumerFilterMunicipalities(selectedRegion)
      .then((list) =>
        setMunicipalityOptions(list.map((m) => ({ value: m, label: m }))),
      )
      .catch(() => setMunicipalityOptions([]));
  }, [selectedRegion]);

  const sections = useMemo(
    () => (isGeoMode ? [] : buildSellerSections(sellers, selectedCountry)),
    [isGeoMode, sellers, selectedCountry],
  );

  const geoSortedSellers = useMemo(() => {
    if (!isGeoMode) {
      return [];
    }
    return [...sellers].sort((a, b) => {
      const distA = a.distance_km ?? Number.POSITIVE_INFINITY;
      const distB = b.distance_km ?? Number.POSITIVE_INFINITY;
      return distA - distB;
    });
  }, [isGeoMode, sellers]);

  const scrollToSection = useCallback((stateName: string) => {
    const y = sectionOffsetsRef.current[stateName];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
      pendingScrollStateRef.current = null;
      return;
    }
    pendingScrollStateRef.current = stateName;
  }, []);

  useEffect(() => {
    if (scrollToState) {
      scrollToSection(scrollToState);
    }
  }, [scrollToState, sections, scrollToSection]);

  if (!canLoadSellers) {
    return (
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
          <Pressable style={styles.backPressable} onPress={() => router.push('/(buyer)/buscar')}>
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>
        </View>
        <View style={styles.emptyCategoryBox}>
          <Text style={styles.emptyCategoryText}>
            Selecciona un tratamiento o usa &quot;Buscar dentistas cerca de mí&quot; en la pestaña
            Buscar.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
        <Pressable style={styles.backPressable} onPress={() => router.push('/(buyer)/buscar')}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}>
        {displayBanners.length > 0 ? (
          <View style={styles.bannerSection}>
            <ConsumerBannerCarousel banners={displayBanners} width={bannerWidth} />
          </View>
        ) : null}

        <Text style={styles.categoryHeading}>{categoryTitle.toUpperCase()}</Text>

        {isGeoMode && hasValidGeo ? (
          <Text style={styles.geoHint}>
            Mostrando médicos dentro de {DEFAULT_SEARCH_RADIUS_KM} km de tu ubicación
          </Text>
        ) : null}

        <View style={styles.regionRow}>
          {GEO_REGIONS.map((region) => {
            const active = selectedRegion === region.key;
            return (
              <Pressable
                key={region.key}
                style={[styles.regionPill, active && styles.regionPillActive]}
                onPress={() => {
                  setSelectedRegion(active ? null : region.key);
                  setSelectedMunicipality(null);
                  setScrollToState(null);
                }}>
                <Text style={[styles.regionPillText, active && styles.regionPillTextActive]}>
                  {region.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filtersRow}>
          {selectedRegion ? (
            <View style={styles.filterFull}>
              <SearchableSelect
                variant="pill"
                pillPrefix="ALCALDÍA / MUNICIPIO"
                label="Alcaldía o municipio"
                placeholder="ALCALDÍA / MUNICIPIO"
                options={municipalityOptions}
                value={selectedMunicipality ?? undefined}
                onChange={(value) => setSelectedMunicipality(value || null)}
              />
            </View>
          ) : null}

          {!isGeoMode ? (
            <>
              <View style={styles.filterHalf}>
                <SearchableSelect
                  variant="pill"
                  pillPrefix="PAÍS"
                  label="País"
                  placeholder="PAÍS"
                  options={countryOptions}
                  value={selectedCountry ?? undefined}
                  onChange={(value) => {
                    setSelectedCountry(value || null);
                    setScrollToState(null);
                    pendingScrollStateRef.current = null;
                    sectionOffsetsRef.current = {};
                  }}
                />
              </View>
              {selectedCountry ? (
                <View style={styles.filterHalf}>
                  <SearchableSelect
                    variant="pill"
                    pillPrefix="ESTADO/PROVINCIA"
                    label="Estado / provincia"
                    placeholder="ESTADO/PROVINCIA"
                    options={stateOptions}
                    value={scrollToState ?? undefined}
                    onChange={(value) => {
                      const next = value || null;
                      setScrollToState(next);
                      if (next) {
                        pendingScrollStateRef.current = next;
                      }
                    }}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator
            color={IsiPlazaColors.primary}
            style={styles.loader}
            size="large"
          />
        ) : error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadSellers()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isGeoMode ? (
          <View style={styles.section}>
            {geoSortedSellers.length === 0 ? (
              <Text style={styles.sectionEmpty}>
                No hay médicos con ubicación registrada dentro de {DEFAULT_SEARCH_RADIUS_KM} km.
              </Text>
            ) : (
              <View style={styles.grid}>
                {geoSortedSellers.map((seller) => (
                  <SellerGridCard
                    key={seller.id}
                    seller={seller}
                    width={cardWidth}
                    onPress={() => router.push(`/(buyer)/medicos/${seller.id}` as Href)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View
            onLayout={(e) => {
              sectionOffsetsRef.current.__listStart = e.nativeEvent.layout.y;
            }}>
            {sections.map((section) => (
              <View
                key={section.title}
                style={styles.section}
                onLayout={(e) => {
                  const base = sectionOffsetsRef.current.__listStart ?? 0;
                  sectionOffsetsRef.current[section.title] = base + e.nativeEvent.layout.y;
                  if (pendingScrollStateRef.current === section.title) {
                    scrollToSection(section.title);
                  }
                }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    scrollToState === section.title && styles.sectionTitleHighlight,
                  ]}>
                  {section.title.toUpperCase()}
                </Text>
                {section.sellers.length === 0 ? (
                  <Text style={styles.sectionEmpty}>
                    Actualmente no hay médicos registrados
                  </Text>
                ) : (
                  <View style={styles.grid}>
                    {section.sellers.map((seller) => (
                      <SellerGridCard
                        key={`${section.title}-${seller.id}`}
                        seller={seller}
                        width={cardWidth}
                        onPress={() => router.push(`/(buyer)/medicos/${seller.id}` as Href)}
                      />
                    ))}
                  </View>
                )}
              </View>
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
    backgroundColor: IsiPlazaColors.white,
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    backgroundColor: IsiPlazaColors.white,
    paddingHorizontal: HORIZONTAL_PAD,
    paddingBottom: IsiPlazaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IsiPlazaColors.border,
  },
  backPressable: {
    alignSelf: 'flex-start',
    paddingVertical: IsiPlazaSpacing.xs,
  },
  backText: {
    color: IsiPlazaColors.primaryDark,
    fontSize: 18,
    fontWeight: '600',
  },
  bannerSection: {
    marginTop: IsiPlazaSpacing.sm,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  categoryHeading: {
    marginTop: IsiPlazaSpacing.lg,
    marginHorizontal: HORIZONTAL_PAD,
    fontSize: 22,
    fontWeight: '800',
    color: IsiPlazaColors.text,
  },
  geoHint: {
    marginTop: IsiPlazaSpacing.xs,
    marginHorizontal: HORIZONTAL_PAD,
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
  },
  regionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IsiPlazaSpacing.sm,
    marginTop: IsiPlazaSpacing.md,
    marginHorizontal: HORIZONTAL_PAD,
  },
  regionPill: {
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: IsiPlazaColors.white,
  },
  regionPillActive: {
    backgroundColor: IsiPlazaColors.primary,
  },
  regionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: IsiPlazaColors.primary,
  },
  regionPillTextActive: {
    color: IsiPlazaColors.white,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: IsiPlazaSpacing.sm,
    marginTop: IsiPlazaSpacing.md,
    marginHorizontal: HORIZONTAL_PAD,
  },
  filterHalf: {
    flex: 1,
    minWidth: '45%',
  },
  filterFull: {
    flex: 1,
    minWidth: '100%',
  },
  loader: {
    marginTop: 40,
  },
  messageBox: {
    marginTop: 32,
    paddingHorizontal: HORIZONTAL_PAD,
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
  section: {
    marginTop: IsiPlazaSpacing.lg,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    marginBottom: IsiPlazaSpacing.sm,
  },
  sectionTitleHighlight: {
    color: IsiPlazaColors.primary,
  },
  sectionEmpty: {
    fontSize: 14,
    fontStyle: 'italic',
    color: IsiPlazaColors.textSecondary,
    marginBottom: IsiPlazaSpacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
    justifyContent: 'flex-start',
  },
  emptyCategoryBox: {
    flex: 1,
    justifyContent: 'center',
    padding: IsiPlazaSpacing.lg,
  },
  emptyCategoryText: {
    fontSize: 15,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
});
