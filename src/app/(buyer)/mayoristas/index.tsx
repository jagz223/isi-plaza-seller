import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import MultiSelect from 'react-native-multiple-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IsiHeader, IsiScreen } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';

const { width, height } = Dimensions.get('window');

export default function MayoristasIndexScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);

  // Mocks
  const banners = useMemo(() => ['Banner 1', 'Banner 2', 'Banner 3'].reverse(), []); // Último añadido primero

  const mayoristasData = [
    { id: 1, name: 'Mayorista A', country: 'México' },
    { id: 2, name: 'Mayorista B', country: 'Colombia' },
    { id: 3, name: 'Mayorista C', country: 'Argentina' },
  ];

  const mayoristas = useMemo(() => {
    if (selectedCountry.length > 0) {
      return mayoristasData.filter(m => m.country === selectedCountry[0]);
    }
    return mayoristasData;
  }, [selectedCountry]);

  // Auto-scroll logic for banners (every 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  return (
    <IsiScreen scrollable={false}>
      <IsiHeader title="Mayoristas" />
      
      {/* Banner Carousel (40% height) */}
      <View style={{ height: height * 0.4 }}>
        <FlatList
          ref={flatListRef}
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => (
            <View style={[styles.bannerContainer, { width }]}>
              <View style={styles.bannerMock}>
                <Text style={styles.bannerText}>{item}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Filter and List */}
      <View style={styles.listContainer}>
        <View style={styles.filterContainer}>
          <MultiSelect
            items={[
              { id: 'México', name: 'México' },
              { id: 'Colombia', name: 'Colombia' },
              { id: 'Argentina', name: 'Argentina' },
              { id: 'Chile', name: 'Chile' },
              { id: 'Uruguay', name: 'Uruguay' },
            ]}
            uniqueKey="id"
            onSelectedItemsChange={setSelectedCountry}
            selectedItems={selectedCountry}
            selectText="Filtrar por país"
            searchInputPlaceholderText="Buscar país..."
            tagRemoveIconColor="#E00000"
            tagBorderColor="#E00000"
            tagTextColor="#E00000"
            selectedItemTextColor="#E00000"
            selectedItemIconColor="#E00000"
            itemTextColor="#000"
            displayKey="name"
            searchInputStyle={{ color: '#000' }}
            submitButtonColor="#E00000"
            submitButtonText="OK"
            single
            styleMainWrapper={styles.multiSelectWrapper}
            styleDropdownMenuSubsection={styles.multiSelectDropdown}
          />
        </View>

        <FlatList
          data={mayoristas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.sellersList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.sellerCard}
              onPress={() => router.push(`/(buyer)/mayoristas/${item.id}`)}
            >
              <Text style={styles.sellerName}>{item.name}</Text>
              <Text style={styles.sellerCountry}>{item.country}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    flex: 1,
    padding: 16,
  },
  bannerMock: {
    flex: 1,
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    color: IsiPlazaColors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    marginBottom: 16,
    zIndex: 9999,
  },
  multiSelectWrapper: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  multiSelectDropdown: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  sellersList: {
    gap: 12,
  },
  sellerCard: {
    padding: 16,
    backgroundColor: IsiPlazaColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: IsiPlazaColors.text,
  },
  sellerCountry: {
    color: IsiPlazaColors.textSecondary,
    marginTop: 4,
  },
});
