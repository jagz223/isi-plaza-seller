import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { OdonticaLogo } from '@/components/odontica';
import { SPLASH_BACKGROUND } from '@/constants/splash';

const screen = Dimensions.get('screen');

type BrandSplashProps = {
  visible: boolean;
};

export function BrandSplash({ visible }: BrandSplashProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    void SystemUI.setBackgroundColorAsync(SPLASH_BACKGROUND);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none">
      <StatusBar style="light" backgroundColor={SPLASH_BACKGROUND} translucent />
      <OdonticaLogo variant="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: screen.width,
    height: screen.height,
    backgroundColor: SPLASH_BACKGROUND,
    zIndex: 999,
    elevation: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
