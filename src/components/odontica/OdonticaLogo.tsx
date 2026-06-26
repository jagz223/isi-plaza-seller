import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { IsiPlazaColors } from '@/constants/isi-plaza';

type OdonticaLogoProps = {
  /** Texto claro sobre fondo oscuro */
  variant?: 'dark' | 'light';
  compact?: boolean;
  showTagline?: boolean;
};

export function OdonticaLogo({
  variant = 'dark',
  compact = false,
  showTagline = true,
}: OdonticaLogoProps) {
  const isLight = variant === 'light';
  const titleColor = isLight ? IsiPlazaColors.white : IsiPlazaColors.text;
  const taglineColor = isLight ? 'rgba(255,255,255,0.9)' : IsiPlazaColors.textSecondary;
  const iconColor = isLight ? IsiPlazaColors.white : IsiPlazaColors.text;
  const iconSize = compact ? 44 : 56;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconRow}>
        <MaterialCommunityIcons name="tooth" size={iconSize} color={iconColor} />
        <View style={[styles.heart, compact && styles.heartCompact]}>
          <MaterialCommunityIcons name="heart" size={compact ? 12 : 14} color={IsiPlazaColors.accent} />
        </View>
      </View>
      <Text style={[styles.title, compact && styles.titleCompact, { color: titleColor }]}>
        {Brand.appName}
      </Text>
      {showTagline ? (
        <Text style={[styles.tagline, compact && styles.taglineCompact, { color: taglineColor }]}>
          {Brand.tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  iconRow: {
    position: 'relative',
    marginBottom: 4,
  },
  heart: {
    position: 'absolute',
    top: 4,
    right: -6,
  },
  heartCompact: {
    top: 2,
    right: -4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  titleCompact: {
    fontSize: 22,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  taglineCompact: {
    fontSize: 10,
    letterSpacing: 2,
  },
});
