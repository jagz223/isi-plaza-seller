import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CategoryPicker,
  IsiButton,
  IsiInput,
  IsiScreen,
  IsiSectionTitle,
  LoadingOverlay,
} from '@/components/isi-plaza';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAuth } from '@/contexts/AuthContext';
import { resolveMediaUrl } from '@/services/api/config';
import { formatValidationErrors } from '@/services/api/errors';
import {
  buildProfilePatchBody,
  deleteCatalogImage,
  fetchBusinessCategories,
  fetchCatalogImages,
  fetchProfile,
  isLocalImageUri,
  patchProfileAvatar,
  patchProfileJson,
  uploadCatalogImage,
} from '@/services/api/seller';
import type { BusinessCategory, CatalogImage, SellerUser } from '@/types/seller-api';

const CATALOG_SLOTS = [1, 2, 3, 4, 5] as const;

export default function PerfilScreen() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);

  const [catalogImages, setCatalogImages] = useState<CatalogImage[]>([]);
  /** Vista previa local al elegir imagen (antes/durante subida) */
  const [pendingCatalogBySlot, setPendingCatalogBySlot] = useState<Record<number, string>>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const slotsMap = useMemo(() => {
    const map = new Map<number, CatalogImage>();
    catalogImages.forEach((img) => map.set(img.display_order, img));
    return map;
  }, [catalogImages]);

  const applyProfileToForm = useCallback((profile: SellerUser) => {
    const sp = profile.seller_profile;
    setBusinessName(profile.name);
    setDescription(sp?.description ?? '');
    setCountry(sp?.country ?? '');
    setState(sp?.state ?? '');
    setWhatsapp(sp?.whatsapp ?? '');
    setInstagram(sp?.instagram ?? '');
    setFacebook(sp?.facebook ?? '');
    setWebsite(sp?.website ?? '');
    setAvatarUrl(sp?.avatar_url ?? null);
    setCategoryId(sp?.business_category_id ?? sp?.business_category?.id ?? null);
    setCategoryName(sp?.business_category?.name ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, profile, images] = await Promise.all([
        fetchBusinessCategories(),
        fetchProfile(),
        fetchCatalogImages(),
      ]);
      setCategories(cats);
      setCatalogImages(images);
      applyProfileToForm(profile);
      setPendingAvatarUri(null);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [applyProfileToForm]);

  useEffect(() => {
    load();
  }, [load]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const cats = await fetchBusinessCategories();
      setCategories(cats);
      return cats;
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Rubros', err.message ?? 'No se pudieron cargar los rubros.');
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const openCategoryPicker = useCallback(async () => {
    setPickerVisible(true);
    if (categories.length === 0) {
      await loadCategories();
    }
  }, [categories.length, loadCategories]);

  const pickImage = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir imágenes.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const handlePickAvatar = async () => {
    const uri = await pickImage();
    if (uri) setPendingAvatarUri(uri);
  };

  const handleSaveProfile = async () => {
    if (!categoryId) {
      Alert.alert('Validación', 'Selecciona un rubro de negocio.');
      return;
    }

    setSaving(true);
    try {
      const body = buildProfilePatchBody({
        business_category_id: categoryId,
        description,
        country,
        state,
        whatsapp,
        instagram,
        facebook,
        website,
      });

      // 1) Texto siempre como application/json (evita FormData vacío en RN)
      await patchProfileJson(body);

      // 2) Avatar en otra petición multipart, solo si hay foto local nueva
      if (isLocalImageUri(pendingAvatarUri)) {
        await patchProfileAvatar(pendingAvatarUri);
      }
      setPendingAvatarUri(null);
      await refreshSession();
      await load();
      Alert.alert('Éxito', 'Perfil guardado correctamente.');
    } catch (e: unknown) {
      const err = e as { validationErrors?: Record<string, string[]>; message?: string };
      Alert.alert(
        'Error al guardar',
        formatValidationErrors(err.validationErrors) || err.message || 'Intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadCatalogForSlot = async (slot: number, uri: string, replaceId?: number) => {
    setPendingCatalogBySlot((prev) => ({ ...prev, [slot]: uri }));
    setUploadingSlot(slot);
    try {
      if (replaceId) {
        await deleteCatalogImage(replaceId);
      }
      const uploaded = await uploadCatalogImage(uri, slot);
      setCatalogImages((prev) => [
        ...prev.filter((i) => i.display_order !== slot && i.id !== replaceId),
        uploaded,
      ]);
      setPendingCatalogBySlot((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    } catch (err: unknown) {
      setPendingCatalogBySlot((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      const e = err as { message?: string };
      Alert.alert('Error', e.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleCatalogSlot = async (slot: number) => {
    const existing = slotsMap.get(slot);
    if (existing) {
      Alert.alert(`Carrusel ${slot}`, '¿Qué deseas hacer?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reemplazar imagen',
          onPress: async () => {
            const uri = await pickImage();
            if (!uri) return;
            await uploadCatalogForSlot(slot, uri, existing.id);
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setUploadingSlot(slot);
            try {
              await deleteCatalogImage(existing.id);
              setCatalogImages((prev) => prev.filter((i) => i.id !== existing.id));
              setPendingCatalogBySlot((prev) => {
                const next = { ...prev };
                delete next[slot];
                return next;
              });
            } catch (err: unknown) {
              const e = err as { message?: string };
              Alert.alert('Error', e.message ?? 'No se pudo eliminar.');
            } finally {
              setUploadingSlot(null);
            }
          },
        },
      ]);
      return;
    }

    const uri = await pickImage();
    if (!uri) return;
    await uploadCatalogForSlot(slot, uri);
  };

  const getCatalogPreviewUri = (slot: number): string | null => {
    const pending = pendingCatalogBySlot[slot];
    if (pending) return pending;
    const image = slotsMap.get(slot);
    return resolveMediaUrl(image?.image_url) ?? image?.image_url ?? null;
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  const displayAvatar = pendingAvatarUri ?? resolveMediaUrl(avatarUrl) ?? avatarUrl;

  return (
    <IsiScreen contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Esta es la información que verán los usuarios</Text>

      {user?.seller_profile?.is_verified ? (
        <Text style={styles.badge}>✓ Cuenta verificada</Text>
      ) : null}

      <IsiSectionTitle>Foto de perfil</IsiSectionTitle>
      <Pressable style={styles.photoPlaceholder} onPress={handlePickAvatar}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={styles.photoPlaceholderText}>+ Añadir foto de perfil</Text>
        )}
      </Pressable>

      <IsiSectionTitle>Datos del negocio</IsiSectionTitle>
      <View style={styles.fields}>
        <IsiInput label="Nombre comercial" value={businessName} editable={false} />
        <Text style={styles.nameHint}>
          Definido al registrarte (users.name). Este guardado no cambia el nombre; solo rubro, descripción,
          ubicación y contacto en seller_profiles.
        </Text>
        <Pressable style={styles.selectField} onPress={openCategoryPicker}>
          <Text style={styles.selectLabel}>Rubro</Text>
          <Text style={styles.selectValue}>{categoryName || 'Seleccionar rubro'}</Text>
        </Pressable>
        <IsiInput
          label="Descripción (máx. 100 caracteres)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={100}
          style={styles.textArea}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <IsiInput label="País" value={country} onChangeText={setCountry} />
          </View>
          <View style={styles.half}>
            <IsiInput label="Estado / Provincia" value={state} onChangeText={setState} />
          </View>
        </View>
      </View>

      <IsiSectionTitle>Contacto y redes</IsiSectionTitle>
      <View style={styles.fields}>
        <IsiInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
        <IsiInput label="Instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
        <IsiInput label="Facebook" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />
        <IsiInput label="Página web" value={website} onChangeText={setWebsite} autoCapitalize="none" />
      </View>

      <IsiSectionTitle>Catálogo — 5 posiciones (PDF: carruseles)</IsiSectionTitle>
      <Text style={styles.catalogHint}>
        Toca cada carrusel para elegir una imagen. Se sube al instante (no hace falta pulsar Guardar perfil).
      </Text>
      {CATALOG_SLOTS.map((slot) => {
        const previewUri = getCatalogPreviewUri(slot);
        const isUploading = uploadingSlot === slot;
        return (
          <View key={slot} style={styles.catalogCard}>
            <Text style={styles.catalogTitle}>Carrusel {slot}</Text>
            <Pressable
              style={styles.catalogSlot}
              onPress={() => handleCatalogSlot(slot)}
              disabled={isUploading}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.catalogPreview} contentFit="cover" />
              ) : (
                <Text style={styles.carouselSlotText}>+ Añadir imagen</Text>
              )}
              {isUploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={IsiPlazaColors.primary} />
                </View>
              ) : null}
            </Pressable>
          </View>
        );
      })}

      <IsiButton label="Guardar perfil" onPress={handleSaveProfile} disabled={saving} style={styles.saveButton} />

      <CategoryPicker
        visible={pickerVisible}
        categories={categories}
        selectedId={categoryId}
        loading={categoriesLoading}
        onSelect={(cat) => {
          setCategoryId(cat.id);
          setCategoryName(cat.name);
        }}
        onClose={() => setPickerVisible(false)}
        onRetry={loadCategories}
      />
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.md,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IsiPlazaColors.text,
    textAlign: 'center',
    marginBottom: IsiPlazaSpacing.sm,
  },
  badge: {
    textAlign: 'center',
    color: IsiPlazaColors.success,
    fontWeight: '600',
  },
  fields: {
    gap: IsiPlazaSpacing.md,
  },
  nameHint: {
    fontSize: 12,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 16,
    marginTop: -IsiPlazaSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: IsiPlazaSpacing.md,
  },
  half: {
    flex: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoPlaceholder: {
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: IsiPlazaColors.primaryMuted,
    borderRadius: IsiPlazaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.backgroundMuted,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    color: IsiPlazaColors.primary,
    fontWeight: '600',
  },
  selectField: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.sm,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.xs,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IsiPlazaColors.text,
  },
  selectValue: {
    fontSize: 16,
    color: IsiPlazaColors.textSecondary,
  },
  catalogCard: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.sm,
  },
  catalogHint: {
    fontSize: 12,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 16,
    marginBottom: IsiPlazaSpacing.sm,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.text,
  },
  catalogSlot: {
    height: 120,
    borderRadius: IsiPlazaRadius.sm,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catalogPreview: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselSlotText: {
    fontSize: 16,
    color: IsiPlazaColors.primary,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: IsiPlazaSpacing.md,
    marginBottom: IsiPlazaSpacing.xl,
  },
});
