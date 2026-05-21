import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { IsiPlazaColors } from '@/constants/isi-plaza';

export function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.background,
  },
});
