import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { fetchConsumerBusinessCategories } from '@/services/api/consumer';
import type { BusinessCategory } from '@/types/seller-api';

const CATEGORY_ROW_GAP = 14;
const CATEGORY_FONT_SIZE = 17;
const CATEGORY_LINE_HEIGHT = 22;
const SUBTITLE_FONT_SIZE = 16;
const SUBTITLE_LINE_HEIGHT = 20;

export default function BuscarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsumerBusinessCategories();
      setCategories(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudieron cargar los rubros.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
        <Text style={styles.headerTitle}>Descubre mayoristas</Text>
      </View>

      <View style={styles.body}>
        {loading && (
          <ActivityIndicator size="large" color={IsiPlazaColors.primary} style={styles.loader} />
        )}

        {!loading && error && (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && categories.length === 0 && (
          <Text style={styles.emptyText}>
            No hay rubros disponibles. Ejecuta el seeder en el servidor.
          </Text>
        )}

        {!loading && !error && categories.length > 0 && (
          <View style={styles.categoriesWrap}>
            <Text style={styles.subtitle}>
              BUSCA MAYORISTAS POR PAÍS Y ESTADO, CHECA SU CATÁLOGO Y CONTACTALO
            </Text>
            <FlatList
              data={categories}
              numColumns={2}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/(buyer)/mayoristas?category=${item.id}&categoryName=${encodeURIComponent(item.name)}`,
                    )
                  }>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  header: {
    backgroundColor: IsiPlazaColors.primary,
    paddingBottom: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  categoriesWrap: {
    flex: 1,
  },
  loader: {
    marginTop: 48,
  },
  messageBox: {
    marginTop: 32,
    paddingHorizontal: IsiPlazaSpacing.lg,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
  },
  emptyText: {
    marginTop: 32,
    paddingHorizontal: IsiPlazaSpacing.lg,
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingBottom: IsiPlazaSpacing.md,
  },
  row: {
    gap: 12,
    marginBottom: CATEGORY_ROW_GAP,
  },
  subtitle: {
    marginTop: IsiPlazaSpacing.md,
    marginBottom: CATEGORY_ROW_GAP,
    paddingLeft: IsiPlazaSpacing.sm,
    paddingRight: 2,
    fontSize: SUBTITLE_FONT_SIZE,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    textAlign: 'center',
    lineHeight: SUBTITLE_LINE_HEIGHT,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  categoryCard: {
    flex: 1,
    minHeight: 76,
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  categoryText: {
    fontSize: CATEGORY_FONT_SIZE,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
    lineHeight: CATEGORY_LINE_HEIGHT,
  },
});
