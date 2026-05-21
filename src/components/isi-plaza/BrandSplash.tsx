import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IsiPlazaColors } from '@/constants/isi-plaza';

SplashScreen.preventAutoHideAsync().catch(() => {});

export function BrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setVisible(false);
      await SplashScreen.hideAsync();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Image
        source={require('@/assets/images/splash-brand.jpg')}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: IsiPlazaColors.primary,
    zIndex: 999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
