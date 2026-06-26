import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ConsumerBannerCarousel } from '@/components/buyer/ConsumerBannerCarousel';
import { SearchableSelect, type SelectOption } from '@/components/isi-plaza/SearchableSelect';
import { GEO_REGIONS, type GeoRegionKey } from '@/constants/geo-mexico';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import type { ConsumerBanner } from '@/types/consumer-api';

type Props = {
  banners: ConsumerBanner[];
  bannerWidth: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onNearMe: () => void;
  locating: boolean;
  selectedRegion: GeoRegionKey | null;
  onRegionPress: (region: GeoRegionKey) => void;
  selectedMunicipality: string | null;
  onMunicipalityChange: (value: string | null) => void;
  municipalityOptions: SelectOption[];
  onBannerPress?: (banner: ConsumerBanner) => void;
  showBack?: boolean;
  onBack?: () => void;
  showRegionFilters?: boolean;
};

export function BuyerMedicosSearchHeader({
  banners,
  bannerWidth,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar tratamiento o dentista',
  onNearMe,
  locating,
  selectedRegion,
  onRegionPress,
  selectedMunicipality,
  onMunicipalityChange,
  municipalityOptions,
  onBannerPress,
  showBack,
  onBack,
  showRegionFilters = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      {showBack && onBack ? (
        <Pressable style={styles.backPressable} onPress={onBack}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
      ) : null}

      {banners.length > 0 ? (
        <View style={styles.bannerSection}>
          <ConsumerBannerCarousel
            banners={banners}
            width={bannerWidth}
            onBannerPress={onBannerPress}
          />
        </View>
      ) : null}

      <Text style={styles.question}>¿Qué tratamiento buscas?</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={IsiPlazaColors.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={IsiPlazaColors.textSecondary}
          returnKeyType="search"
        />
      </View>

      <TouchableOpacity
        style={styles.nearMeButton}
        activeOpacity={0.85}
        disabled={locating}
        onPress={onNearMe}>
        {locating ? (
          <ActivityIndicator color={IsiPlazaColors.white} />
        ) : (
          <Text style={styles.nearMeButtonText}>Buscar dentistas cerca de mí</Text>
        )}
      </TouchableOpacity>

      {showRegionFilters ? (
        <>
          <View style={styles.regionRow}>
            {GEO_REGIONS.map((region) => {
              const active = selectedRegion === region.key;
              return (
                <Pressable
                  key={region.key}
                  style={[styles.regionPill, active && styles.regionPillActive]}
                  onPress={() => onRegionPress(region.key)}>
                  <Text style={[styles.regionPillText, active && styles.regionPillTextActive]}>
                    {region.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedRegion ? (
            <SearchableSelect
              variant="pill"
              pillPrefix="ALCALDÍA / MUNICIPIO"
              label="Alcaldía o municipio"
              placeholder="ALCALDÍA / MUNICIPIO"
              options={municipalityOptions}
              value={selectedMunicipality ?? undefined}
              onChange={(value) => onMunicipalityChange(value || null)}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: IsiPlazaSpacing.md,
    paddingTop: IsiPlazaSpacing.sm,
  },
  backPressable: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: IsiPlazaColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  bannerSection: {},
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: IsiPlazaColors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: IsiPlazaColors.text,
    paddingVertical: 10,
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
  regionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IsiPlazaSpacing.sm,
  },
  regionPill: {
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.pill,
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
});
