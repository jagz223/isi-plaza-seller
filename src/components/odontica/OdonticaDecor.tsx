import { StyleSheet, View } from 'react-native';

import { IsiPlazaColors } from '@/constants/isi-plaza';

/**
 * Acentos decorativos en esquinas, siempre dentro del viewport (sin scroll en web).
 */
export function OdonticaDecor() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
    </View>
  );
}

const CORNER = 72;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER,
    height: CORNER,
    borderBottomLeftRadius: CORNER,
    backgroundColor: IsiPlazaColors.primary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER * 1.15,
    height: CORNER * 1.15,
    borderTopRightRadius: CORNER * 1.15,
    backgroundColor: IsiPlazaColors.primary,
  },
});
