import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IsiPlazaColors, IsiPlazaRadius } from '@/constants/isi-plaza';
import { formatSellerLocationBlock } from '@/utils/format-seller-location';
import { formatDistanceKmCompact } from '@/utils/location';

export type SellerListCardData = {
  id: number;
  name: string;
  description?: string | null;
  professional_license?: string | null;
  address?: string | null;
  municipality?: string | null;
  country?: string | null;
  state?: string | string[] | null;
  distance_km?: number | null;
  avatar_url?: string | null;
};

type Props = {
  seller: SellerListCardData;
  onPress: () => void;
};

const THUMB_SIZE = 96;

export function SellerListCard({ seller, onPress }: Props) {
  const locationBlock = formatSellerLocationBlock(seller);
  const distanceLabel =
    seller.distance_km != null ? formatDistanceKmCompact(seller.distance_km) : null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}

      <View style={styles.topRow}>
        <View style={styles.thumbWrap}>
          {seller.avatar_url ? (
            <Image source={{ uri: seller.avatar_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="image-outline" size={36} color={IsiPlazaColors.primaryMuted} />
            </View>
          )}
        </View>

        <View style={styles.identityCol}>
          <Text style={styles.label}>NOMBRE</Text>
          <Text style={styles.name} numberOfLines={2}>
            {seller.name}
          </Text>
          {seller.professional_license ? (
            <>
              <Text style={[styles.label, styles.labelSpacing]}>CÉDULA</Text>
              <Text style={styles.license} numberOfLines={1}>
                {seller.professional_license}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {locationBlock ? (
        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>UBICACIÓN:</Text>
          <Text style={styles.locationText}>{locationBlock}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    padding: 12,
    gap: 10,
    position: 'relative',
  },
  distance: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: 13,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 56,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    flexShrink: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: IsiPlazaRadius.sm,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    backgroundColor: '#D9D9D9',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EAF0',
  },
  identityCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    letterSpacing: 0.2,
  },
  labelSpacing: {
    marginTop: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: IsiPlazaColors.text,
  },
  license: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.text,
  },
  locationBlock: {
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IsiPlazaColors.border,
    paddingTop: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: IsiPlazaColors.text,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    lineHeight: 16,
  },
});
