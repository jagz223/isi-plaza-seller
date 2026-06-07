import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SellerGridCard } from '@/components/buyer/SellerGridCard';
import { IsiHeader, IsiScreen } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { fetchConsumerFavorites } from '@/services/api/consumer';
import type { ConsumerSeller } from '@/types/consumer-api';

const GRID_COLUMNS = 2;
const GRID_GAP = 10;
const HORIZONTAL_PAD = IsiPlazaSpacing.md;

export default function GuardadosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - HORIZONTAL_PAD * 2;
  const cardWidth = Math.min(
    (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
    175,
  );

  const [sellers, setSellers] = useState<ConsumerSeller[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConsumerFavorites();
      setSellers(data);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  return (
    <IsiScreen scrollable={false}>
      <IsiHeader title="Mis Guardados" showBack={false} />
      <View style={[styles.container, { paddingBottom: insets.bottom + 72 }]}>
        {loading ? (
          <ActivityIndicator size="large" color={IsiPlazaColors.primary} style={styles.loader} />
        ) : sellers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aún no has guardado ningún mayorista.{'\n'}
              Pulsa el corazón en el perfil de un mayorista para añadirlo aquí.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Tus mayoristas favoritos</Text>
            <View style={styles.grid}>
              {sellers.map((seller) => (
                <SellerGridCard
                  key={seller.id}
                  seller={seller}
                  width={cardWidth}
                  onPress={() => router.push(`/(buyer)/mayoristas/${seller.id}`)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  loader: {
    marginTop: 48,
  },
  scrollContent: {
    paddingTop: IsiPlazaSpacing.md,
    paddingBottom: IsiPlazaSpacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    marginBottom: IsiPlazaSpacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: GRID_GAP,
    justifyContent: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: IsiPlazaSpacing.md,
  },
  emptyText: {
    color: IsiPlazaColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
