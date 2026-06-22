import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IsiPlazaColors } from '@/constants/isi-plaza';

type IsiScreenProps = ScrollViewProps & {
  withHeader?: boolean;
  children: React.ReactNode;
};

export function IsiScreen({ withHeader = false, children, contentContainerStyle, ...rest }: IsiScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={withHeader ? ['bottom'] : ['top', 'bottom']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={Platform.OS === 'android'}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          {...rest}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});
