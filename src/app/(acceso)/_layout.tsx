import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { IsiPlazaColors } from '@/constants/isi-plaza';

export default function AccesoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.screen,
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.background,
  },
});
