import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SellerVerifiedBadge } from '@/components/buyer/SellerVerifiedBadge';
import {
  SELLER_CARD_AVATAR_HEIGHT,
  SELLER_CARD_DESC_FONT_SIZE,
  SELLER_CARD_DESC_LINE_HEIGHT,
  SELLER_CARD_DESC_MAX_LINES,
} from '@/constants/buyer-seller-display';
import { IsiPlazaColors, IsiPlazaRadius } from '@/constants/isi-plaza';
import { formatDistanceKm } from '@/utils/location';

export type SellerGridCardData = {
  id: number;
  name: string;
  description?: string | null;
  professional_license?: string | null;
  municipality?: string | null;
  distance_km?: number | null;
  avatar_url?: string | null;
  is_verified?: boolean;
};

type Props = {
  seller: SellerGridCardData;
  width: number;
  onPress: () => void;
};

export function SellerGridCard({ seller, width, onPress }: Props) {
  const subtitle =
    seller.distance_km != null
      ? formatDistanceKm(seller.distance_km)
      : seller.municipality?.trim() || seller.description?.trim() || 'Sin descripción';

  return (
    <Pressable
      style={[styles.card, { width, maxWidth: width }]}
      onPress={onPress}>
      <View style={[styles.cardImageWrap, { width, height: SELLER_CARD_AVATAR_HEIGHT }]}>
        {seller.avatar_url ? (
          <Image
            source={{ uri: seller.avatar_url }}
            style={[styles.cardImage, { width, height: SELLER_CARD_AVATAR_HEIGHT }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.cardImage,
              styles.cardImagePlaceholder,
              { width, height: SELLER_CARD_AVATAR_HEIGHT },
            ]}
          />
        )}
        {seller.is_verified ? <SellerVerifiedBadge variant="card" /> : null}
      </View>
      <Text style={[styles.cardName, { maxWidth: width }]} numberOfLines={2} ellipsizeMode="tail">
        {seller.name}
      </Text>
      {seller.professional_license ? (
        <Text style={[styles.cardLicense, { maxWidth: width }]} numberOfLines={1}>
          Céd. {seller.professional_license}
        </Text>
      ) : null}
      <Text
        style={[styles.cardDescription, { maxWidth: width }]}
        numberOfLines={SELLER_CARD_DESC_MAX_LINES}
        ellipsizeMode="tail">
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 0,
    flexShrink: 0,
    borderWidth: 2,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.sm,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.white,
  },
  cardImageWrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  cardImage: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  cardImagePlaceholder: {
    backgroundColor: '#D9D9D9',
  },
  cardName: {
    width: '100%',
    fontSize: 11,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    paddingHorizontal: 6,
    paddingTop: 6,
    overflow: 'hidden',
  },
  cardLicense: {
    width: '100%',
    fontSize: 10,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    paddingHorizontal: 6,
    paddingTop: 2,
    overflow: 'hidden',
  },
  cardDescription: {
    width: '100%',
    fontSize: SELLER_CARD_DESC_FONT_SIZE,
    color: IsiPlazaColors.text,
    paddingHorizontal: 6,
    paddingBottom: 8,
    paddingTop: 2,
    lineHeight: SELLER_CARD_DESC_LINE_HEIGHT,
    minHeight: SELLER_CARD_DESC_LINE_HEIGHT * SELLER_CARD_DESC_MAX_LINES,
    maxHeight: SELLER_CARD_DESC_LINE_HEIGHT * SELLER_CARD_DESC_MAX_LINES,
    overflow: 'hidden',
  },
});
