import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';

export type SelectOption = {
  value: string;
  label: string;
  /** Texto extra para búsqueda (ej. nombre del país detrás del prefijo) */
  searchText?: string;
};

type SearchableSelectProps = {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  compact?: boolean;
  /** Pastilla roja tipo "PAÍS: MÉXICO" (filtros de mayoristas) */
  variant?: 'default' | 'pill';
  /** Con variant pill: texto base, ej. PAÍS o ESTADO/PROVINCIA */
  pillPrefix?: string;
  /** Selección simple */
  value?: string;
  onChange?: (value: string) => void;
  /** Selección múltiple */
  multiple?: boolean;
  values?: string[];
  onChangeMultiple?: (values: string[]) => void;
};

function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function SearchableSelect({
  label,
  placeholder = 'Seleccionar',
  options,
  disabled = false,
  compact = false,
  variant = 'default',
  pillPrefix,
  value,
  onChange,
  multiple = false,
  values = [],
  onChangeMultiple,
}: SearchableSelectProps) {
  const isPill = variant === 'pill';
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(multiple ? values : value ? [value] : []), [multiple, value, values]);

  const displayValue = useMemo(() => {
    if (multiple) {
      if (values.length === 0) return '';
      if (values.length <= 2) return values.join(', ');
      return `${values.length} seleccionados`;
    }
    const opt = options.find((o) => o.value === value);
    return opt?.label ?? value ?? '';
  }, [multiple, options, value, values]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    if (!q) return options;
    return options.filter((o) => {
      const haystack = normalizeSearch(`${o.label} ${o.searchText ?? ''} ${o.value}`);
      return haystack.includes(q);
    });
  }, [options, query]);

  const open = () => {
    if (disabled) return;
    setQuery('');
    setDraft(multiple ? [...values] : []);
    setVisible(true);
  };

  const close = () => setVisible(false);

  const toggleDraft = (itemValue: string) => {
    setDraft((prev) =>
      prev.includes(itemValue) ? prev.filter((v) => v !== itemValue) : [...prev, itemValue],
    );
  };

  const confirmMultiple = () => {
    onChangeMultiple?.(draft);
    close();
  };

  const selectSingle = (itemValue: string) => {
    onChange?.(itemValue);
    close();
  };

  const activeValues = multiple ? (visible ? draft : values) : value ? [value] : [];

  const pillText = useMemo(() => {
    const prefix = pillPrefix ?? placeholder;
    if (!displayValue) {
      return prefix;
    }
    return `${prefix}: ${displayValue.toUpperCase()}`;
  }, [displayValue, pillPrefix, placeholder]);

  return (
    <>
      <Pressable
        style={[
          isPill ? styles.triggerPill : styles.trigger,
          !isPill && compact && styles.triggerCompact,
          disabled && styles.triggerDisabled,
        ]}
        onPress={open}
        disabled={disabled}>
        {isPill ? (
          <Text style={styles.triggerPillText} numberOfLines={1}>
            {pillText}
          </Text>
        ) : (
          <>
            <Text style={styles.triggerLabel}>{label}</Text>
            <View style={styles.triggerRow}>
              <Text
                style={[styles.triggerValue, !displayValue && styles.triggerPlaceholder]}
                numberOfLines={2}>
                {displayValue || placeholder}
              </Text>
              <Ionicons name="chevron-down" size={20} color={IsiPlazaColors.textSecondary} />
            </View>
          </>
        )}
      </Pressable>

      {multiple && values.length > 0 ? (
        <View style={styles.chips}>
          {values.map((v) => (
            <View key={v} style={styles.chip}>
              <Text style={styles.chipText}>{v}</Text>
              <Pressable
                hitSlop={8}
                onPress={() => onChangeMultiple?.(values.filter((x) => x !== v))}>
                <Ionicons name="close-circle" size={18} color={IsiPlazaColors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, IsiPlazaSpacing.lg) }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{isPill ? (pillPrefix ?? label) : label}</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={IsiPlazaColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                placeholderTextColor={IsiPlazaColors.textSecondary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={IsiPlazaColors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No hay resultados para «{query}»</Text>
              }
              renderItem={({ item }) => {
                const isSelected = activeValues.includes(item.value);
                return (
                  <Pressable
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => (multiple ? toggleDraft(item.value) : selectSingle(item.value))}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={IsiPlazaColors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />

            {multiple ? (
              <Pressable style={styles.confirmBtn} onPress={confirmMultiple}>
                <Text style={styles.confirmBtnText}>Aceptar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: IsiPlazaSpacing.md,
    backgroundColor: IsiPlazaColors.white,
    gap: IsiPlazaSpacing.xs,
  },
  triggerCompact: {
    paddingVertical: IsiPlazaSpacing.sm,
  },
  triggerPill: {
    borderWidth: 2,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: IsiPlazaColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  triggerPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IsiPlazaColors.text,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: IsiPlazaSpacing.sm,
  },
  triggerValue: {
    flex: 1,
    fontSize: 16,
    color: IsiPlazaColors.text,
  },
  triggerPlaceholder: {
    color: IsiPlazaColors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IsiPlazaSpacing.sm,
    marginTop: -IsiPlazaSpacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderWidth: 1,
    borderColor: IsiPlazaColors.primaryMuted,
    borderRadius: IsiPlazaRadius.pill,
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
  },
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
    maxHeight: '80%',
    minHeight: 320,
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    marginBottom: IsiPlazaSpacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IsiPlazaSpacing.sm,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: IsiPlazaSpacing.sm,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    marginBottom: IsiPlazaSpacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IsiPlazaColors.text,
    paddingVertical: 4,
  },
  list: {
    maxHeight: 340,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IsiPlazaColors.border,
  },
  optionSelected: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderRadius: IsiPlazaRadius.sm,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: IsiPlazaColors.text,
    paddingRight: IsiPlazaSpacing.sm,
  },
  optionTextSelected: {
    color: IsiPlazaColors.primary,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: IsiPlazaColors.textSecondary,
    paddingVertical: IsiPlazaSpacing.xl,
    fontSize: 15,
  },
  confirmBtn: {
    marginTop: IsiPlazaSpacing.md,
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    paddingVertical: IsiPlazaSpacing.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: IsiPlazaColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
