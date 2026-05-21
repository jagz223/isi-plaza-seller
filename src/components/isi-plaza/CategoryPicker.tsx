import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import type { BusinessCategory } from '@/types/seller-api';

type CategoryPickerProps = {
  visible: boolean;
  categories: BusinessCategory[];
  selectedId: number | null;
  loading?: boolean;
  onSelect: (category: BusinessCategory) => void;
  onClose: () => void;
  onRetry?: () => void;
};

export function CategoryPicker({
  visible,
  categories,
  selectedId,
  loading = false,
  onSelect,
  onClose,
  onRetry,
}: CategoryPickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, IsiPlazaSpacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Selecciona un rubro</Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No se pudieron cargar los rubros.</Text>
              {onRetry ? (
                <Pressable style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.item, selectedId === item.id && styles.itemSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}>
                  <Text style={[styles.itemText, selectedId === item.id && styles.itemTextSelected]}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: IsiPlazaColors.white,
    borderTopLeftRadius: IsiPlazaRadius.lg,
    borderTopRightRadius: IsiPlazaRadius.lg,
    maxHeight: '75%',
    minHeight: 280,
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: IsiPlazaColors.border,
    marginBottom: IsiPlazaSpacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: IsiPlazaSpacing.md,
    color: IsiPlazaColors.text,
  },
  list: {
    flexGrow: 0,
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: IsiPlazaSpacing.md,
  },
  item: {
    paddingVertical: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: IsiPlazaColors.border,
  },
  itemSelected: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderRadius: IsiPlazaRadius.sm,
  },
  itemText: {
    fontSize: 16,
    color: IsiPlazaColors.text,
  },
  itemTextSelected: {
    color: IsiPlazaColors.primary,
    fontWeight: '600',
  },
  centered: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IsiPlazaSpacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: IsiPlazaSpacing.sm,
    paddingHorizontal: IsiPlazaSpacing.lg,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
  },
});
