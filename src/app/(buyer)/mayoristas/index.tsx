import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { getStatesForCountry } from '@/constants/location-data';
import {
  fetchConsumerBanners,
  fetchConsumerFilterCountries,
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
  const params = useLocalSearchParams<{ category?: string; categoryName?: string }>();

  const categoryId = params.category ? Number(params.category) : null;
  const categoryTitle = params.categoryName
    ? decodeURIComponent(String(params.categoryName))
    : 'Mayoristas';

  const [banners, setBanners] = useState<ConsumerBanner[]>([]);
  const [sellers, setSellers] = useState<ConsumerSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>('México');
  const [scrollToState, setScrollToState] = useState<string | null>(null);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Record<string, number>>({});
  const pendingScrollStateRef = useRef<string | null>(null);

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
    if (categoryId == null || Number.isNaN(categoryId)) {
      setSellers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await fetchConsumerSellers({
        businessCategoryId: categoryId,
        country: selectedCountry ?? undefined,
      });
      setSellers(list);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudieron cargar los mayoristas.');
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, selectedCountry]);

  useEffect(() => {
    void fetchConsumerFilterCountries()
      .then((list) =>
        setCountryOptions(list.map((c) => ({ value: c.name, label: c.name }))),
      )
      .catch(() => setCountryOptions([]));
  }, []);

  useEffect(() => {
    if (categoryId == null || Number.isNaN(categoryId)) {
      setBanners([]);
      return;
    }
    void fetchConsumerBanners(categoryId)
      .then(setBanners)
      .catch(() => setBanners([]));
  }, [categoryId]);

  useEffect(() => {
    void loadSellers();
  }, [loadSellers]);

  useEffect(() => {
    if (categoryId != null && !Number.isNaN(categoryId)) {
      setSelectedCountry('México');
    }
  }, [categoryId]);

  useEffect(() => {
    if (!selectedCountry) {
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
  }, [selectedCountry]);

  const sections = useMemo(
    () => buildSellerSections(sellers, selectedCountry),
    [sellers, selectedCountry],
  );

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

  if (categoryId == null || Number.isNaN(categoryId)) {
    return (
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
          <Pressable style={styles.backPressable} onPress={() => router.push('/(buyer)/buscar')}>
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>
        </View>
        <View style={styles.emptyCategoryBox}>
          <Text style={styles.emptyCategoryText}>
            Selecciona un rubro en la pestaña Buscar para ver mayoristas.
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

        <View style={styles.filtersRow}>
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
                  Actualmente no hay mayoristas registrados
                </Text>
              ) : (
                <View style={styles.grid}>
                  {section.sellers.map((seller) => (
                    <SellerGridCard
                      key={`${section.title}-${seller.id}`}
                      seller={seller}
                      width={cardWidth}
                      onPress={() => router.push(`/(buyer)/mayoristas/${seller.id}`)}
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: IsiPlazaSpacing.sm,
    marginTop: IsiPlazaSpacing.md,
    marginHorizontal: HORIZONTAL_PAD,
  },
  filterHalf: {
    flex: 1,
    minWidth: 0,
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
