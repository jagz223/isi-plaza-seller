import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IsiHeader, IsiScreen, IsiSectionTitle } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';

export default function BuscarScreen() {
  const router = useRouter();

  // Mocks for categories
  const categories = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `Rubro ${i + 1}`,
  }));

  return (
    <IsiScreen scrollable={false}>
      <IsiHeader title="Buscar Mayoristas" showBack={false} />
      <View style={styles.container}>
        <IsiSectionTitle title="Explorar Categorías" />
        <FlatList
          data={categories}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => router.push(`/(buyer)/mayoristas?category=${item.id}`)}
            >
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  row: {
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    height: 100,
    backgroundColor: IsiPlazaColors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: IsiPlazaColors.text,
  },
});
