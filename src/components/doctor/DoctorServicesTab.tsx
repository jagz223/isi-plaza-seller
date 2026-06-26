import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DoctorSaveButton } from '@/components/doctor/DoctorSaveButton';
import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';
import { IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  fetchDoctorServices,
  fetchSellerTreatments,
  syncDoctorServices,
} from '@/services/api/seller';
import type { TreatmentSection } from '@/types/seller-api';

type ServiceDraft = {
  treatment_id: number;
  price: string;
  selected: boolean;
};

export function DoctorServicesTab() {
  const [sections, setSections] = useState<TreatmentSection[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ServiceDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, services] = await Promise.all([
        fetchSellerTreatments(),
        fetchDoctorServices(),
      ]);

      const byTreatment = new Map(services.map((s) => [s.treatment_id, s]));
      const next: Record<number, ServiceDraft> = {};
      catalog.forEach((section) => {
        section.treatments.forEach((treatment) => {
          const saved = byTreatment.get(treatment.id);
          next[treatment.id] = {
            treatment_id: treatment.id,
            price: saved ? String(saved.price) : '',
            selected: Boolean(saved),
          };
        });
      });
      setSections(catalog);
      setDrafts(next);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudieron cargar los tratamientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        treatments: section.treatments.filter(
          (t) =>
            t.name.toLowerCase().includes(q) || section.name.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.treatments.length > 0);
  }, [sections, filter]);

  const toggleTreatment = (treatmentId: number) => {
    setDrafts((prev) => {
      const current = prev[treatmentId];
      if (!current) return prev;
      return {
        ...prev,
        [treatmentId]: { ...current, selected: !current.selected },
      };
    });
  };

  const setPrice = (treatmentId: number, price: string) => {
    const sanitized = price.replace(/[^0-9.]/g, '');
    setDrafts((prev) => {
      const current = prev[treatmentId];
      if (!current) return prev;
      return {
        ...prev,
        [treatmentId]: { ...current, price: sanitized, selected: true },
      };
    });
  };

  const handleSave = async () => {
    const services = Object.values(drafts)
      .filter((d) => d.selected && d.price.trim())
      .map((d) => ({
        treatment_id: d.treatment_id,
        price: Number(d.price),
      }));

    const invalid = services.find((s) => !Number.isFinite(s.price) || s.price <= 0);
    if (invalid) {
      Alert.alert('Revisa los precios', 'Cada servicio seleccionado necesita un precio mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      await syncDoctorServices(services);
      await load();
      Alert.alert('Guardado', 'Tus servicios se actualizaron correctamente.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudieron guardar los servicios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={DoctorUIColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Selecciona un servicio"
          placeholderTextColor={DoctorUIColors.textMuted}
          value={filter}
          onChangeText={setFilter}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {filteredSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            {section.treatments.map((treatment) => {
              const draft = drafts[treatment.id];
              if (!draft) return null;
              const isSelected = draft.selected;
              return (
                <View key={treatment.id} style={styles.treatmentBlock}>
                  <Pressable
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => toggleTreatment(treatment.id)}>
                    <Text style={styles.serviceName}>{treatment.name}</Text>
                  </Pressable>
                  {isSelected ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Precio MXN</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={draft.price}
                        onChangeText={(text) => setPrice(treatment.id, text)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={DoctorUIColors.textMuted}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {filteredSections.length === 0 ? (
          <Text style={styles.empty}>No hay servicios que coincidan con tu búsqueda.</Text>
        ) : null}
      </ScrollView>

      <DoctorSaveButton
        label="Guardar"
        onPress={() => void handleSave()}
        disabled={saving}
        loading={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: IsiPlazaSpacing.sm,
  },
  loader: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  searchCard: {
    backgroundColor: DoctorUIColors.white,
    borderRadius: DoctorUIRadius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '600',
    color: DoctorUIColors.primary,
  },
  scroll: {
    flex: 1,
    maxHeight: 420,
  },
  scrollContent: {
    paddingBottom: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DoctorUIColors.primary,
  },
  treatmentBlock: {
    gap: 6,
  },
  serviceCard: {
    backgroundColor: DoctorUIColors.white,
    borderRadius: DoctorUIRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: DoctorUIColors.primary,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: DoctorUIColors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DoctorUIColors.textMuted,
  },
  priceInput: {
    flex: 1,
    backgroundColor: DoctorUIColors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: DoctorUIColors.primary,
    borderWidth: 1,
    borderColor: DoctorUIColors.slot,
  },
  empty: {
    textAlign: 'center',
    color: DoctorUIColors.textMuted,
    paddingVertical: 24,
  },
});
