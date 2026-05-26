import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IsiHeader, IsiScreen, IsiSectionTitle } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';

export default function GuardadosScreen() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('ISI_PLAZA_FAVORITES').then((data) => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  return (
    <IsiScreen scrollable={false}>
      <IsiHeader title="Mis Guardados" showBack={false} />
      <View style={styles.container}>
        <IsiSectionTitle title="Mayoristas Favoritos" />
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aún no has guardado ningún mayorista.</Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text>Mayorista ID: {item}</Text>
              </View>
            )}
          />
        )}
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: IsiPlazaColors.textSecondary,
    fontSize: 16,
  },
  card: {
    padding: 16,
    backgroundColor: IsiPlazaColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    marginBottom: 12,
  },
});
