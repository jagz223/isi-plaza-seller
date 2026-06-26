import { StyleSheet, View } from 'react-native';

import { IsiPlazaColors } from '@/constants/isi-plaza';

/** Círculos decorativos de las esquinas (mockup Odontica). */
export function OdonticaDecor() {
  return (
    <>
      <View style={styles.circleTopRight} />
      <View style={styles.circleMidRight} />
      <View style={styles.circleBottomLeft} />
    </>
  );
}

const CIRCLE = 120;

const styles = StyleSheet.create({
  circleTopRight: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: IsiPlazaColors.primary,
  },
  circleMidRight: {
    position: 'absolute',
    top: '42%',
    right: -56,
    width: CIRCLE * 0.75,
    height: CIRCLE * 0.75,
    borderRadius: (CIRCLE * 0.75) / 2,
    backgroundColor: IsiPlazaColors.primary,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -48,
    left: -48,
    width: CIRCLE * 1.1,
    height: CIRCLE * 1.1,
    borderRadius: (CIRCLE * 1.1) / 2,
    backgroundColor: IsiPlazaColors.primary,
  },
});
