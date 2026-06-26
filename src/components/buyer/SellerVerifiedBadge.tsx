import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { VERIFIED_BADGE_RED } from '@/constants/buyer-seller-display';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';

type Props = {
  /** Tarjetas de lista/guardados: tipografía y padding más compactos. */
  variant?: 'hero' | 'card';
};

export function SellerVerifiedBadge({ variant = 'hero' }: Props) {
  const isCard = variant === 'card';

  return (
    <View style={[styles.badge, isCard ? styles.badgeCard : styles.badgeHero]}>
      <Text style={[styles.text, isCard && styles.textCard]} numberOfLines={1}>
        {Brand.verifiedDoctor}
      </Text>
      <View style={[styles.icon, isCard && styles.iconCard]}>
        <Ionicons name="checkmark" size={isCard ? 12 : 16} color={IsiPlazaColors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.black,
    borderRadius: IsiPlazaRadius.pill,
    maxWidth: '92%',
  },
  badgeHero: {
    right: IsiPlazaSpacing.sm,
    bottom: IsiPlazaSpacing.sm,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  badgeCard: {
    right: 4,
    bottom: 4,
    paddingLeft: 6,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 4,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    letterSpacing: 0.2,
  },
  textCard: {
    fontSize: 8,
    letterSpacing: 0,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VERIFIED_BADGE_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCard: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
