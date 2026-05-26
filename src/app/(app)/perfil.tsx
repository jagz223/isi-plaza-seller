import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MultiSelect from 'react-native-multiple-select';

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
  patchProfileJson,
  patchProfileWithAvatar,
  patchProfileFormData,
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
  const [state, setState] = useState<string[]>([]); // MultiSelect needs an array of IDs
  const [whatsappPrefix, setWhatsappPrefix] = useState<string[]>([ '+54' ]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
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

  const [pendingPdf, setPendingPdf] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [pendingExcel, setPendingExcel] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [carouselTitles, setCarouselTitles] = useState<Record<number, string>>({});
  const [carouselDescriptions, setCarouselDescriptions] = useState<Record<number, string>>({});

  const applyProfileToForm = useCallback((profile: SellerUser) => {
    const sp = profile.seller_profile;
    setBusinessName(profile.name);
    setDescription(sp?.description ?? '');
    setCountry(sp?.country ?? '');
    
    // Parse state as array if it's stored as JSON
    try {
      if (sp?.state) {
        const parsed = JSON.parse(sp.state);
        setState(Array.isArray(parsed) ? parsed : [sp.state]);
      } else {
        setState([]);
      }
    } catch {
      setState(sp?.state ? [sp.state] : []);
    }

    if (sp?.whatsapp) {
      if (sp.whatsapp.startsWith('+')) {
        const prefixEnd = sp.whatsapp.indexOf(' ', 1) > -1 ? sp.whatsapp.indexOf(' ', 1) : 3;
        setWhatsappPrefix([sp.whatsapp.substring(0, prefixEnd)]);
        setWhatsappNumber(sp.whatsapp.substring(prefixEnd).trim());
      } else {
        setWhatsappNumber(sp.whatsapp);
      }
    }
    
    setInstagram(sp?.instagram ?? '');
    setFacebook(sp?.facebook ?? '');
    setWebsite(sp?.website ?? '');
    setAvatarUrl(sp?.avatar_url ?? null);
    setCategoryId(sp?.business_category_id ?? sp?.business_category?.id ?? null);
    setCategoryName(sp?.business_category?.name ?? '');

    // Parse carousel metadata from profile if available
    if (sp?.carousel_metadata && Array.isArray(sp.carousel_metadata)) {
      const titles: Record<number, string> = {};
      const desc: Record<number, string> = {};
      sp.carousel_metadata.forEach((item: any, idx: number) => {
        titles[idx + 1] = item.title || '';
        desc[idx + 1] = item.description || '';
      });
      setCarouselTitles(titles);
      setCarouselDescriptions(desc);
    }
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

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      setPendingPdf({ uri: result.assets[0].uri, name: result.assets[0].name, type: 'application/pdf' });
    }
  };

  const handlePickExcel = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingExcel({ uri: result.assets[0].uri, name: result.assets[0].name, type: result.assets[0].mimeType ?? 'application/vnd.ms-excel' });
    }
  };

  const handleSaveProfile = async () => {
    if (!categoryId) {
      Alert.alert('Validación', 'Selecciona un rubro de negocio.');
      return;
    }

    setSaving(true);
    try {
      const fullWhatsapp = whatsappPrefix.length > 0 && whatsappNumber ? `${whatsappPrefix[0]} ${whatsappNumber}` : whatsappNumber;

      const body = buildProfilePatchBody({
        business_category_id: categoryId,
        description,
        country,
        state,
        whatsapp: fullWhatsapp,
        instagram,
        facebook,
        website,
      });

      const carousel_metadata = CATALOG_SLOTS.map((slot) => ({
        title: carouselTitles[slot] || '',
        description: carouselDescriptions[slot] || '',
      }));

      // Si hay archivos, usamos FormData
      if (pendingPdf || pendingExcel) {
        const formData = new FormData();
        Object.entries(body).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        
        // Agregar states si es array
        if (Array.isArray(body.state)) {
          body.state.forEach((s) => {
            formData.append('state[]', s);
          });
          delete body.state; // remove string version
        }

        // Agregar carousel metadata como array JSON
        carousel_metadata.forEach((meta, idx) => {
          formData.append(`carousel_metadata[${idx}][title]`, meta.title);
          formData.append(`carousel_metadata[${idx}][description]`, meta.description);
        });

        if (pendingPdf) {
          formData.append('pdf', {
            uri: pendingPdf.uri,
            name: pendingPdf.name,
            type: pendingPdf.type,
          } as any);
        }
        if (pendingExcel) {
          formData.append('excel', {
            uri: pendingExcel.uri,
            name: pendingExcel.name,
            type: pendingExcel.type,
          } as any);
        }
        if (isLocalImageUri(pendingAvatarUri)) {
          formData.append('avatar', {
            uri: pendingAvatarUri,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          } as any);
        }

        await patchProfileFormData(formData);
      } else {
        // Enviar normal
        const bodyWithMeta = { ...body, carousel_metadata };
        if (isLocalImageUri(pendingAvatarUri)) {
          await patchProfileWithAvatar(bodyWithMeta, pendingAvatarUri);
        } else {
          await patchProfileJson(bodyWithMeta);
        }
      }

      setPendingAvatarUri(null);
      setPendingPdf(null);
      setPendingExcel(null);
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
        </View>
        
        <View style={styles.multiSelectContainer}>
          <Text style={styles.inputLabel}>Estados / Provincias</Text>
          <MultiSelect
            items={[
              { id: 'CABA', name: 'CABA' },
              { id: 'Buenos Aires', name: 'Buenos Aires' },
              { id: 'Córdoba', name: 'Córdoba' },
              { id: 'Santa Fe', name: 'Santa Fe' },
              { id: 'Mendoza', name: 'Mendoza' },
              { id: 'Tucumán', name: 'Tucumán' },
              { id: 'Entre Ríos', name: 'Entre Ríos' },
              { id: 'Salta', name: 'Salta' },
              { id: 'Montevideo', name: 'Montevideo' }, // URU
              { id: 'Canelones', name: 'Canelones' }, // URU
              { id: 'Santiago', name: 'Santiago' }, // CHI
              { id: 'Valparaíso', name: 'Valparaíso' }, // CHI
            ]}
            uniqueKey="id"
            onSelectedItemsChange={setState}
            selectedItems={state}
            selectText="Seleccionar provincias"
            searchInputPlaceholderText="Buscar provincia..."
            tagRemoveIconColor="#E00000"
            tagBorderColor="#E00000"
            tagTextColor="#E00000"
            selectedItemTextColor="#E00000"
            selectedItemIconColor="#E00000"
            itemTextColor="#000"
            displayKey="name"
            searchInputStyle={{ color: '#000' }}
            submitButtonColor="#E00000"
            submitButtonText="Aceptar"
            styleMainWrapper={styles.multiSelectWrapper}
            styleDropdownMenuSubsection={styles.multiSelectDropdown}
          />
        </View>

        <IsiSectionTitle>Documentos del Mayorista</IsiSectionTitle>
        <View style={styles.row}>
          <View style={styles.half}>
             <IsiButton label={pendingPdf ? "PDF Listo ✓" : "Subir PDF"} onPress={handlePickPdf} variant={pendingPdf ? "primary" : "secondary"} />
          </View>
          <View style={styles.half}>
             <IsiButton label={pendingExcel ? "Excel Listo ✓" : "Subir Excel"} onPress={handlePickExcel} variant={pendingExcel ? "primary" : "secondary"} />
          </View>
        </View>
      </View>

      <IsiSectionTitle>Contacto y redes</IsiSectionTitle>
      <View style={styles.fields}>
        <View style={styles.whatsappRow}>
          <View style={styles.whatsappPrefix}>
             <MultiSelect
              items={[
                { id: '+54', name: '🇦🇷 +54' },
                { id: '+52', name: '🇲🇽 +52' },
                { id: '+56', name: '🇨🇱 +56' },
                { id: '+598', name: '🇺🇾 +598' },
                { id: '+57', name: '🇨🇴 +57' },
                { id: '+1', name: '🇺🇸 +1' },
                { id: '+34', name: '🇪🇸 +34' },
              ]}
              uniqueKey="id"
              onSelectedItemsChange={setWhatsappPrefix}
              selectedItems={whatsappPrefix}
              selectText="Prefijo"
              searchInputPlaceholderText="Buscar"
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
          <View style={styles.whatsappNum}>
             <IsiInput label="Número (máx 12)" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" maxLength={12} />
          </View>
        </View>
        <Text style={styles.nameHint}>El link web se autogenerará con mensaje predeterminado.</Text>
        <IsiInput label="Instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" maxLength={25} />
        <IsiInput label="Facebook" value={facebook} onChangeText={setFacebook} autoCapitalize="none" maxLength={25} />
        <IsiInput label="Página web" value={website} onChangeText={setWebsite} autoCapitalize="none" />
      </View>

      <IsiSectionTitle>Catálogo — 5 posiciones (PDF: carruseles)</IsiSectionTitle>
      <Text style={styles.catalogHint}>
        Toca cada carrusel para elegir una imagen. Se sube al instante en Base64 (no requiere Guardar perfil).
        Avatar: se envía al pulsar Guardar perfil.
      </Text>
      {CATALOG_SLOTS.map((slot) => {
        const previewUri = getCatalogPreviewUri(slot);
        const isUploading = uploadingSlot === slot;
        return (
          <View key={slot} style={styles.catalogCard}>
            <Text style={styles.catalogTitle}>Carrusel {slot}</Text>
            
            <IsiInput
              label="Título del carrusel"
              maxLength={30}
              value={carouselTitles[slot] || ''}
              onChangeText={(val) => setCarouselTitles(prev => ({ ...prev, [slot]: val }))}
            />
            <IsiInput
              label="Descripción del carrusel"
              maxLength={65}
              value={carouselDescriptions[slot] || ''}
              onChangeText={(val) => setCarouselDescriptions(prev => ({ ...prev, [slot]: val }))}
            />

            <Pressable
              style={styles.catalogSlot}
              onPress={() => handleCatalogSlot(slot)}
              disabled={isUploading}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.catalogPreview} contentFit="cover" />
              ) : (
                <Text style={styles.carouselSlotText}>+ Añadir imagen (máx 5)</Text>
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IsiPlazaColors.text,
    marginBottom: IsiPlazaSpacing.xs,
  },
  multiSelectContainer: {
    marginBottom: IsiPlazaSpacing.sm,
  },
  multiSelectWrapper: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.sm,
    paddingHorizontal: IsiPlazaSpacing.sm,
    backgroundColor: '#fff',
  },
  multiSelectDropdown: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  whatsappRow: {
    flexDirection: 'row',
    gap: IsiPlazaSpacing.sm,
    alignItems: 'flex-start',
    zIndex: 9999, // ensures dropdown appears over other elements
  },
  whatsappPrefix: {
    flex: 1,
  },
  whatsappNum: {
    flex: 2,
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
