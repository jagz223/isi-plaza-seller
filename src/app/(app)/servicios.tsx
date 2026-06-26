import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IsiButton, IsiScreen, IsiSectionTitle } from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  fetchDoctorServices,
  fetchSellerTreatments,
  syncDoctorServices,
} from '@/services/api/seller';
import type { DoctorServiceItem, TreatmentSection } from '@/types/seller-api';

type ServiceDraft = {
  treatment_id: number;
  price: string;
  selected: boolean;
};

export default function ServiciosScreen() {
  const [sections, setSections] = useState<TreatmentSection[]>([]);
  const [existing, setExisting] = useState<DoctorServiceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ServiceDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, services] = await Promise.all([
        fetchSellerTreatments(),
        fetchDoctorServices(),
      ]);
      setSections(catalog);
      setExisting(services);

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

  const flatTreatments = useMemo(
    () =>
      sections.flatMap((section) =>
        section.treatments.map((treatment) => ({
          ...treatment,
          sectionName: section.name,
        })),
      ),
    [sections],
  );

  const toggleTreatment = (treatmentId: number) => {
    setDrafts((prev) => {
      const current = prev[treatmentId];
      if (!current) {
        return prev;
      }
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
      if (!current) {
        return prev;
      }
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
      Alert.alert('Revisa los precios', 'Cada tratamiento seleccionado necesita un precio mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      await syncDoctorServices(services);
      await load();
      Alert.alert('Guardado', 'Tus servicios y precios se actualizaron correctamente.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudieron guardar los servicios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
      </View>
    );
  }

  return (
    <IsiScreen contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Selecciona los tratamientos que ofreces y define el precio desde. Los pacientes los verán en
        tu perfil.
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sections.map((section) => (
          <View key={section.id} style={styles.sectionBlock}>
            <IsiSectionTitle>{section.name}</IsiSectionTitle>
            {section.treatments.map((treatment) => {
              const draft = drafts[treatment.id];
              if (!draft) {
                return null;
              }
              return (
                <View key={treatment.id} style={styles.treatmentRow}>
                  <TouchableOpacity
                    style={styles.treatmentHeader}
                    onPress={() => toggleTreatment(treatment.id)}
                    activeOpacity={0.8}>
                    <View
                      style={[
                        styles.checkbox,
                        draft.selected && styles.checkboxSelected,
                      ]}>
                      {draft.selected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <Text style={styles.treatmentName}>{treatment.name}</Text>
                  </TouchableOpacity>
                  {draft.selected ? (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Precio MXN</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={draft.price}
                        onChangeText={(text) => setPrice(treatment.id, text)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={IsiPlazaColors.textSecondary}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {flatTreatments.length === 0 ? (
          <Text style={styles.empty}>
            No hay tratamientos configurados. Pide al administrador que los cargue en el panel.
          </Text>
        ) : null}
      </ScrollView>

      <IsiButton
        label={saving ? 'Guardando…' : 'Guardar servicios'}
        onPress={() => void handleSave()}
        disabled={saving || flatTreatments.length === 0}
        style={styles.saveBtn}
      />
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.md,
  },
  intro: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.lg,
  },
  sectionBlock: {
    gap: IsiPlazaSpacing.sm,
  },
  treatmentRow: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.sm,
    backgroundColor: IsiPlazaColors.white,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IsiPlazaSpacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: IsiPlazaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: IsiPlazaColors.primary,
  },
  checkmark: {
    color: IsiPlazaColors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  treatmentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IsiPlazaColors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IsiPlazaSpacing.sm,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.textSecondary,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: IsiPlazaColors.text,
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  empty: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  saveBtn: {
    marginBottom: IsiPlazaSpacing.lg,
  },
});
