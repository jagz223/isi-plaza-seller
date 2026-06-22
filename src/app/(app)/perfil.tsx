import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogSavedImage } from '@/components/CatalogSavedImage';
import {
  CategoryPicker,
  IsiButton,
  IsiInput,
  IsiScreen,
  IsiSectionTitle,
  LoadingOverlay,
  SearchableSelect,
} from '@/components/isi-plaza';
import {
  COUNTRY_NAMES,
  DEFAULT_WHATSAPP_DIAL_CODE,
  formatWhatsapp,
  getCountryByName,
  getDialCodeOptions,
  getStatesForCountry,
  parseWhatsapp,
} from '@/constants/location-data';
import { SellerDocumentPreview } from '@/components/seller/SellerDocumentPreview';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredToken } from '@/services/api/client';
import { resolveMediaUrl } from '@/services/api/config';
import { formatValidationErrors } from '@/services/api/errors';
import {
  buildProfileFormData,
  buildProfilePatchBody,
  deleteCatalogImage,
  deleteSellerProfileExcel,
  deleteSellerProfilePdf,
  fetchBusinessCategories,
  fetchCatalogImages,
  fetchProfile,
  patchProfileFormData,
  patchProfileJson,
} from '@/services/api/seller';
import {
  applyCatalogUploadResultToPending,
  buildCatalogUploadQueue,
  CATALOG_CAROUSEL_COUNT,
  CATALOG_MAX_IMAGES_PER_CAROUSEL,
  formatCatalogUploadFailureMessage,
  type PendingCatalogImage,
  uploadCatalogImageQueue,
  validateCatalogUploadLimits,
} from '@/services/catalog-upload';
import { validateProfileFormBeforeSave, validateDocumentSizeOnWeb } from '@/services/profile-form-validation';
import {
  mimeTypeForDocumentName,
  type PendingDocument,
} from '@/utils/prepare-document-upload';
import { showUserMessage } from '@/utils/show-user-message';
import {
  catalogModeBlocksCarousel,
  catalogModeBlocksExcel,
  catalogModeBlocksPdf,
  resolveSellerCatalogMode,
} from '@/utils/seller-catalog-mode';
import type { BusinessCategory, CatalogImage, SellerUser } from '@/types/seller-api';

const CATALOG_SLOTS = Array.from({ length: CATALOG_CAROUSEL_COUNT }, (_, i) => i + 1);

function newLocalCatalogId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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
  const [state, setState] = useState<string[]>([]);
  const [whatsappDialCode, setWhatsappDialCode] = useState(DEFAULT_WHATSAPP_DIAL_CODE);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);

  const [catalogImages, setCatalogImages] = useState<CatalogImage[]>([]);
  /** Imágenes locales por carrusel; se suben al guardar perfil */
  const [pendingCatalogBySlot, setPendingCatalogBySlot] = useState<
    Record<number, PendingCatalogImage[]>
  >({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [catalogUploadProgress, setCatalogUploadProgress] = useState<{
    completed: number;
    total: number;
    displayOrder: number;
  } | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [catalogAuthToken, setCatalogAuthToken] = useState<string | null>(null);

  useEffect(() => {
    void getStoredToken().then(setCatalogAuthToken);
  }, []);

  const catalogImageAuthHeaders = useMemo(
    () => (catalogAuthToken ? { Authorization: `Bearer ${catalogAuthToken}` } : {}),
    [catalogAuthToken],
  );

  const imagesBySlot = useMemo(() => {
    const map = new Map<number, CatalogImage[]>();
    CATALOG_SLOTS.forEach((slot) => map.set(slot, []));
    catalogImages.forEach((img) => {
      const list = map.get(img.display_order) ?? [];
      list.push(img);
      map.set(img.display_order, list);
    });
    return map;
  }, [catalogImages]);

  const countryOptions = useMemo(
    () => COUNTRY_NAMES.map((name) => ({ value: name, label: name })),
    [],
  );

  const stateOptions = useMemo(
    () => getStatesForCountry(country).map((name) => ({ value: name, label: name })),
    [country],
  );

  const dialCodeOptions = useMemo(() => getDialCodeOptions(), []);

  const handleCountryChange = useCallback((name: string) => {
    setCountry(name);
    const meta = getCountryByName(name);
    if (meta) {
      setWhatsappDialCode(meta.dialCode);
    }
    setState((prev) => {
      const allowed = getStatesForCountry(name);
      return prev.filter((s) => allowed.includes(s));
    });
  }, []);

  const [pendingPdf, setPendingPdf] = useState<PendingDocument | null>(null);
  const [pendingExcel, setPendingExcel] = useState<PendingDocument | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [existingExcelUrl, setExistingExcelUrl] = useState<string | null>(null);

  const [carouselTitles, setCarouselTitles] = useState<Record<number, string>>({});
  const [carouselDescriptions, setCarouselDescriptions] = useState<Record<number, string>>({});

  const applyProfileToForm = useCallback((profile: SellerUser) => {
    const sp = profile.seller_profile;
    setBusinessName(profile.name);
    setDescription(sp?.description ?? '');
    const savedCountry = sp?.country?.trim() || 'México';
    setCountry(savedCountry);

    const allowedStates = getStatesForCountry(savedCountry);
    let parsedStates: string[] = [];
    const rawState = sp?.state;
    if (Array.isArray(rawState)) {
      parsedStates = rawState;
    } else if (typeof rawState === 'string' && rawState) {
      try {
        const json = JSON.parse(rawState) as unknown;
        parsedStates = Array.isArray(json) ? (json as string[]) : [rawState];
      } catch {
        parsedStates = [rawState];
      }
    }
    setState(
      allowedStates.length > 0
        ? parsedStates.filter((s) => allowedStates.includes(s))
        : parsedStates,
    );

    const savedWhatsapp = sp?.whatsapp?.trim() ?? '';
    if (!savedWhatsapp) {
      setWhatsappDialCode(DEFAULT_WHATSAPP_DIAL_CODE);
      setWhatsappNumber('');
    } else {
      const { dialCode, number } = parseWhatsapp(savedWhatsapp);
      const countryMeta = getCountryByName(savedCountry);
      const dialInList = getDialCodeOptions().some((o) => o.value === dialCode);
      setWhatsappDialCode(
        dialInList ? dialCode : (countryMeta?.dialCode ?? DEFAULT_WHATSAPP_DIAL_CODE),
      );
      setWhatsappNumber(number);
    }
    
    setInstagram(sp?.instagram ?? '');
    setFacebook(sp?.facebook ?? '');
    setWebsite(sp?.website ?? '');
    setAvatarUrl(sp?.avatar_url ?? null);
    setExistingPdfUrl(sp?.pdf_url ?? null);
    setExistingExcelUrl(sp?.excel_url ?? null);
    setCategoryId(sp?.business_category_id ?? sp?.business_category?.id ?? null);
    setCategoryName(sp?.business_category?.name ?? '');

    const titles: Record<number, string> = {};
    const desc: Record<number, string> = {};
    if (Array.isArray(sp?.carousel_metadata)) {
      sp.carousel_metadata.forEach((item, idx) => {
        titles[idx + 1] = item.title ?? '';
        desc[idx + 1] = item.description ?? '';
      });
    }
    setCarouselTitles(titles);
    setCarouselDescriptions(desc);
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
      setPendingPdf(null);
      setPendingExcel(null);
      setPendingCatalogBySlot({});
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
    const uris = await pickImages(1);
    return uris[0] ?? null;
  };

  const pickImages = async (maxCount: number): Promise<string[]> => {
    if (maxCount < 1) return [];

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir imágenes.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: maxCount > 1,
      selectionLimit: maxCount,
    });

    if (result.canceled || !result.assets.length) return [];
    return result.assets.map((asset) => asset.uri);
  };

  const getSlotImageCount = (slot: number): number => {
    const saved = imagesBySlot.get(slot)?.length ?? 0;
    const pending = pendingCatalogBySlot[slot]?.length ?? 0;
    return saved + pending;
  };

  const handlePickAvatar = async () => {
    const uri = await pickImage();
    if (uri) setPendingAvatarUri(uri);
  };

  const handlePickPdf = async () => {
    if (pdfBlocked) {
      Alert.alert(
        'Catálogo en PDF',
        'Elimina el Excel o todas las imágenes del carrusel antes de subir un PDF.',
      );
      return;
    }

    const hasCarousel =
      catalogImages.length > 0 || pendingCatalogCount > 0 || Object.values(carouselTitles).some(Boolean);
    if (hasCarousel) {
      Alert.alert(
        'Reemplazar carrusel',
        'Al subir un PDF se eliminarán todas las imágenes y textos del carrusel. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await clearAllCatalogImages();
                await pickPdfFile();
              })();
            },
          },
        ],
      );
      return;
    }

    await pickPdfFile();
  };

  const pickPdfFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.name ?? 'catalogo.pdf';
    if (!name.toLowerCase().endsWith('.pdf')) {
      Alert.alert('Archivo no válido', 'El catálogo debe ser un archivo PDF (.pdf).');
      return;
    }

    const sizeError = await validateDocumentSizeOnWeb(asset.uri, 'El PDF');
    if (sizeError) {
      Alert.alert('Archivo muy grande', sizeError);
      return;
    }

    setPendingPdf({
      uri: asset.uri,
      name,
      type: mimeTypeForDocumentName(name, 'application/pdf'),
    });
    setPendingExcel(null);
  };

  const handlePickExcel = async () => {
    if (excelBlocked) {
      Alert.alert(
        'Lista Excel',
        'Elimina el PDF o todas las imágenes del carrusel antes de subir un Excel.',
      );
      return;
    }

    const hasCarousel =
      catalogImages.length > 0 || pendingCatalogCount > 0 || Object.values(carouselTitles).some(Boolean);
    if (hasCarousel) {
      Alert.alert(
        'Reemplazar carrusel',
        'Al subir un Excel se eliminarán todas las imágenes y textos del carrusel. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await clearAllCatalogImages();
                await pickExcelFile();
              })();
            },
          },
        ],
      );
      return;
    }

    await pickExcelFile();
  };

  const pickExcelFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.name ?? 'lista.xlsx';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      Alert.alert('Archivo no válido', 'La lista debe ser Excel (.xlsx o .xls).');
      return;
    }

    const sizeError = await validateDocumentSizeOnWeb(asset.uri, 'El archivo Excel');
    if (sizeError) {
      Alert.alert('Archivo muy grande', sizeError);
      return;
    }

    setPendingExcel({
      uri: asset.uri,
      name,
      type: mimeTypeForDocumentName(name, asset.mimeType ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    });
    setPendingPdf(null);
  };

  const handleRemovePdf = async () => {
    if (pendingPdf) {
      setPendingPdf(null);
      return;
    }
    if (!existingPdfUrl) {
      return;
    }
    try {
      await deleteSellerProfilePdf();
      setExistingPdfUrl(null);
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo eliminar el PDF.');
    }
  };

  const handleRemoveExcel = async () => {
    if (pendingExcel) {
      setPendingExcel(null);
      return;
    }
    if (!existingExcelUrl) {
      return;
    }
    try {
      await deleteSellerProfileExcel();
      setExistingExcelUrl(null);
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo eliminar el Excel.');
    }
  };

  const pendingCatalogCount = useMemo(
    () => Object.values(pendingCatalogBySlot).reduce((sum, list) => sum + list.length, 0),
    [pendingCatalogBySlot],
  );

  const catalogMode = useMemo(
    () =>
      resolveSellerCatalogMode({
        existingPdfUrl,
        existingExcelUrl,
        pendingPdf: pendingPdf != null,
        pendingExcel: pendingExcel != null,
        catalogImageCount: catalogImages.length,
        pendingCatalogCount,
      }),
    [
      existingPdfUrl,
      existingExcelUrl,
      pendingPdf,
      pendingExcel,
      catalogImages.length,
      pendingCatalogCount,
    ],
  );

  const pdfBlocked = catalogModeBlocksPdf(catalogMode);
  const excelBlocked = catalogModeBlocksExcel(catalogMode);
  const carouselBlocked = catalogModeBlocksCarousel(catalogMode);

  const pdfPreviewUri = useMemo(() => {
    if (pdfBlocked) {
      return null;
    }
    if (pendingPdf?.uri) {
      return pendingPdf.uri;
    }
    if (existingPdfUrl) {
      return resolveMediaUrl(existingPdfUrl) ?? existingPdfUrl;
    }
    return null;
  }, [pdfBlocked, pendingPdf, existingPdfUrl]);

  const excelPreviewUri = useMemo(() => {
    if (excelBlocked) {
      return null;
    }
    if (pendingExcel?.uri) {
      return pendingExcel.uri;
    }
    if (existingExcelUrl) {
      return resolveMediaUrl(existingExcelUrl) ?? existingExcelUrl;
    }
    return null;
  }, [excelBlocked, pendingExcel, existingExcelUrl]);

  const clearAllCatalogImages = useCallback(async () => {
    for (const img of catalogImages) {
      await deleteCatalogImage(img.id);
    }
    setCatalogImages([]);
    setPendingCatalogBySlot({});
    setCarouselTitles({});
    setCarouselDescriptions({});
  }, [catalogImages]);

  const savedCountBySlot = useMemo(() => {
    const map = new Map<number, number>();
    CATALOG_SLOTS.forEach((slot) => map.set(slot, 0));
    catalogImages.forEach((img) => {
      map.set(img.display_order, (map.get(img.display_order) ?? 0) + 1);
    });
    return map;
  }, [catalogImages]);

  const uploadPendingCatalogImages = useCallback(async (): Promise<string | null> => {
    const jobs = buildCatalogUploadQueue(pendingCatalogBySlot);
    if (jobs.length === 0) {
      return null;
    }

    const limitError = validateCatalogUploadLimits(
      catalogImages.length,
      pendingCatalogBySlot,
      savedCountBySlot,
    );
    if (limitError) {
      return limitError;
    }

    setCatalogUploadProgress({ completed: 0, total: jobs.length, displayOrder: jobs[0]!.displayOrder });

    const result = await uploadCatalogImageQueue(jobs, (progress) => {
      setCatalogUploadProgress(progress);
      setUploadingSlot(progress.displayOrder);
    });

    setCatalogUploadProgress(null);
    setUploadingSlot(null);

    if (result.uploaded.length > 0) {
      setCatalogImages((prev) => [...prev, ...result.uploaded]);
    }

    setPendingCatalogBySlot((current) => applyCatalogUploadResultToPending(current, result));

    if (result.failures.length > 0) {
      return formatCatalogUploadFailureMessage(result.failures);
    }

    return null;
  }, [catalogImages.length, pendingCatalogBySlot, savedCountBySlot]);

  const handleSaveProfile = useCallback(async () => {
    setFormMessage(null);
    setSaving(true);

    try {
      const validationError = validateProfileFormBeforeSave({
        businessName,
        categoryId,
        description,
        country,
        state,
        whatsappDialCode,
        whatsappNumber,
        instagram,
        facebook,
        website,
        pendingPdf,
        pendingExcel,
        catalogImages,
        pendingCatalogBySlot,
      });

      if (validationError) {
        setFormMessage(validationError);
        showUserMessage('Revisa tu información', validationError);
        return;
      }

      if (catalogMode === 'carousel') {
        const uploadError = await uploadPendingCatalogImages();
        if (uploadError) {
          setFormMessage(uploadError);
          showUserMessage('Imágenes de catálogo', uploadError);
          return;
        }
      }

      const fullWhatsapp = formatWhatsapp(whatsappDialCode, whatsappNumber);

      const body = buildProfilePatchBody({
        name: businessName,
        business_category_id: categoryId,
        description,
        country,
        state,
        whatsapp: fullWhatsapp,
        instagram,
        facebook,
        website,
      });

      const carousel_metadata =
        catalogMode === 'carousel'
          ? CATALOG_SLOTS.map((slot) => ({
              title: carouselTitles[slot] || '',
              description: carouselDescriptions[slot] || '',
            }))
          : [];

      const hasFiles =
        pendingAvatarUri ||
        (catalogMode === 'pdf' && pendingPdf) ||
        (catalogMode === 'excel' && pendingExcel);

      if (hasFiles) {
        const formData = await buildProfileFormData(body, {
          avatarUri: pendingAvatarUri,
          pdf: catalogMode === 'pdf' ? pendingPdf : null,
          excel: catalogMode === 'excel' ? pendingExcel : null,
          carouselMetadata: carousel_metadata,
        });
        await patchProfileFormData(formData);
      } else {
        await patchProfileJson({
          ...body,
          ...(catalogMode === 'carousel' ? { carousel_metadata } : {}),
        });
      }

      setPendingAvatarUri(null);
      setPendingPdf(null);
      setPendingExcel(null);
      await refreshSession();
      await load();
    } catch (e: unknown) {
      const err = e as { validationErrors?: Record<string, string[]>; message?: string };
      const message =
        formatValidationErrors(err.validationErrors) || err.message || 'Intenta de nuevo.';
      setFormMessage(message);
      showUserMessage('Error al guardar', message);
    } finally {
      setSaving(false);
      setCatalogUploadProgress(null);
      setUploadingSlot(null);
    }
  }, [
    businessName,
    categoryId,
    description,
    country,
    state,
    whatsappDialCode,
    whatsappNumber,
    instagram,
    facebook,
    website,
    pendingPdf,
    pendingExcel,
    catalogImages,
    pendingCatalogBySlot,
    pendingAvatarUri,
    carouselTitles,
    carouselDescriptions,
    catalogMode,
    carouselTitles,
    carouselDescriptions,
    uploadPendingCatalogImages,
    refreshSession,
    load,
  ]);

  const addCatalogImages = async (slot: number) => {
    if (carouselBlocked) {
      Alert.alert(
        'Carrusel bloqueado',
        'Elimina el PDF o el Excel antes de subir imágenes al carrusel.',
      );
      return;
    }

    const remaining = CATALOG_MAX_IMAGES_PER_CAROUSEL - getSlotImageCount(slot);
    if (remaining <= 0) {
      Alert.alert('Límite alcanzado', 'Solo puedes tener hasta 5 imágenes por carrusel.');
      return;
    }

    const uris = await pickImages(remaining);
    if (uris.length === 0) return;

    setPendingCatalogBySlot((prev) => ({
      ...prev,
      [slot]: [
        ...(prev[slot] ?? []),
        ...uris.map((uri) => ({ localId: newLocalCatalogId(), uri })),
      ],
    }));
  };

  const removePendingCatalogImage = (slot: number, localId: string) => {
    setPendingCatalogBySlot((prev) => {
      const list = (prev[slot] ?? []).filter((item) => item.localId !== localId);
      if (list.length === 0) {
        const next = { ...prev };
        delete next[slot];
        return next;
      }
      return { ...prev, [slot]: list };
    });
  };

  const removeSavedCatalogImage = async (slot: number, imageId: number) => {
    setUploadingSlot(slot);
    try {
      await deleteCatalogImage(imageId);
      setCatalogImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert('Error', e.message ?? 'No se pudo eliminar la imagen.');
    } finally {
      setUploadingSlot(null);
    }
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  const displayAvatar = pendingAvatarUri ?? resolveMediaUrl(avatarUrl) ?? avatarUrl;
  const isBusy = saving || catalogUploadProgress !== null;

  return (
    <View style={styles.screenRoot}>
      {isBusy ? <LoadingOverlay message="Guardando perfil…" variant="overlay" /> : null}
      <IsiScreen contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Esta es la información que verán los usuarios</Text>

      {user?.seller_profile?.is_verified ? (
        <Text style={styles.badge}>✓ Cuenta verificada</Text>
      ) : null}

      <IsiSectionTitle>Foto de perfil</IsiSectionTitle>
      <Pressable
        style={[styles.photoPlaceholder, displayAvatar && styles.photoPlaceholderFilled]}
        onPress={handlePickAvatar}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={styles.catalogEmptyInner}>
            <Ionicons name="add-circle-outline" size={36} color={IsiPlazaColors.primary} />
            <Text style={styles.photoPlaceholderText}>+ Añadir foto de perfil</Text>
          </View>
        )}
      </Pressable>

      <IsiSectionTitle>Datos del negocio</IsiSectionTitle>
      <View style={styles.fields}>
        <IsiInput
          label="Nombre comercial"
          value={businessName}
          onChangeText={setBusinessName}
          autoCapitalize="words"
        />
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
        <SearchableSelect
          label="País"
          placeholder="Seleccionar país"
          options={countryOptions}
          value={country || undefined}
          onChange={handleCountryChange}
        />

        <SearchableSelect
          label="Estados / Provincias"
          placeholder={country ? 'Seleccionar provincias' : 'Primero elige un país'}
          options={stateOptions}
          values={state}
          onChangeMultiple={setState}
          multiple
          disabled={!country}
        />

      </View>

      <IsiSectionTitle>Catálogo del negocio</IsiSectionTitle>
      <Text style={styles.docHint}>
        Solo puedes elegir una opción: PDF, Excel o carruseles con imágenes. Para cambiar, elimina lo que subiste
        (máx. 300 MB por archivo).
      </Text>
      <View style={styles.docRow}>
        <Pressable
          style={[
            styles.docUploadSlot,
            (pendingPdf || existingPdfUrl) && styles.docUploadSlotFilled,
            pdfBlocked && styles.docUploadSlotDisabled,
          ]}
          onPress={handlePickPdf}
          disabled={pdfBlocked}>
          <Ionicons
            name={pendingPdf || existingPdfUrl ? 'document-text' : 'add-circle-outline'}
            size={32}
            color={IsiPlazaColors.primary}
          />
          <Text style={styles.docUploadTitle}>Catálogo PDF</Text>
          {pendingPdf ? (
            <>
              <Text style={styles.docUploadStatus} numberOfLines={2}>
                {pendingPdf.name}
              </Text>
              <Text style={styles.docUploadAction}>Toca para cambiar</Text>
            </>
          ) : existingPdfUrl ? (
            <>
              <Text style={styles.docUploadStatus}>Catálogo guardado</Text>
              <Text style={styles.docUploadAction}>Toca para reemplazar</Text>
            </>
          ) : (
            <Text style={styles.docUploadPlaceholder}>+ Añadir PDF</Text>
          )}
          {(pendingPdf || existingPdfUrl) && !pdfBlocked ? (
            <Pressable style={styles.docRemoveBtn} onPress={() => void handleRemovePdf()}>
              <Text style={styles.docRemoveText}>Eliminar PDF</Text>
            </Pressable>
          ) : null}
        </Pressable>

        <Pressable
          style={[
            styles.docUploadSlot,
            (pendingExcel || existingExcelUrl) && styles.docUploadSlotFilled,
            excelBlocked && styles.docUploadSlotDisabled,
          ]}
          onPress={handlePickExcel}
          disabled={excelBlocked}>
          <Ionicons
            name={pendingExcel || existingExcelUrl ? 'document-attach-outline' : 'add-circle-outline'}
            size={32}
            color={IsiPlazaColors.primary}
          />
          <Text style={styles.docUploadTitle}>Lista Excel</Text>
          {pendingExcel ? (
            <>
              <Text style={styles.docUploadStatus} numberOfLines={2}>
                {pendingExcel.name}
              </Text>
              <Text style={styles.docUploadAction}>Toca para cambiar</Text>
            </>
          ) : existingExcelUrl ? (
            <>
              <Text style={styles.docUploadStatus}>Lista guardada</Text>
              <Text style={styles.docUploadAction}>Toca para reemplazar</Text>
            </>
          ) : (
            <Text style={styles.docUploadPlaceholder}>+ Añadir Excel</Text>
          )}
          {(pendingExcel || existingExcelUrl) && !excelBlocked ? (
            <Pressable style={styles.docRemoveBtn} onPress={() => void handleRemoveExcel()}>
              <Text style={styles.docRemoveText}>Eliminar Excel</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      {pdfPreviewUri ? (
        <SellerDocumentPreview
          uri={pdfPreviewUri}
          type="pdf"
          fileName={pendingPdf?.name}
        />
      ) : null}

      {excelPreviewUri ? (
        <SellerDocumentPreview
          uri={excelPreviewUri}
          type="excel"
          fileName={pendingExcel?.name}
        />
      ) : null}

      <IsiSectionTitle>Contacto y redes</IsiSectionTitle>
      <View style={styles.fields}>
        <View style={styles.whatsappRow}>
          <View style={styles.whatsappPrefix}>
            <SearchableSelect
              label="Código"
              placeholder="Prefijo"
              options={dialCodeOptions}
              value={whatsappDialCode}
              onChange={setWhatsappDialCode}
              compact
            />
          </View>
          <View style={styles.whatsappNum}>
            <IsiInput
              label="Número (máx 12)"
              value={whatsappNumber}
              onChangeText={(text) => setWhatsappNumber(text.replace(/\s/g, ''))}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>
        </View>
        <Text style={styles.nameHint}>El link web se autogenerará con mensaje predeterminado.</Text>
        <IsiInput label="Instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" maxLength={25} />
        <IsiInput label="Facebook" value={facebook} onChangeText={setFacebook} autoCapitalize="none" maxLength={25} />
        <IsiInput
          label="Página web"
          placeholder="https://misitio.com"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <IsiSectionTitle>Catálogo — carruseles (5 posiciones)</IsiSectionTitle>
      <Text style={styles.catalogHint}>
        {carouselBlocked
          ? 'Elimina el PDF o Excel para habilitar los carruseles.'
          : 'Hasta 5 imágenes por carrusel (25 en total). Cada imagen se envía al guardar.'}
      </Text>
      {CATALOG_SLOTS.map((slot) => {
        const savedImages = imagesBySlot.get(slot) ?? [];
        const pendingImages = pendingCatalogBySlot[slot] ?? [];
        const imageCount = getSlotImageCount(slot);
        const canAddMore = imageCount < CATALOG_MAX_IMAGES_PER_CAROUSEL;
        const isUploading = uploadingSlot === slot;

        return (
          <View
            key={slot}
            style={[styles.catalogCard, carouselBlocked && styles.catalogCardDisabled]}>
            <Text style={styles.catalogTitle}>
              Carrusel {slot} ({imageCount}/{CATALOG_MAX_IMAGES_PER_CAROUSEL})
            </Text>

            <IsiInput
              label="Título del carrusel"
              maxLength={30}
              value={carouselTitles[slot] || ''}
              onChangeText={(val) => setCarouselTitles((prev) => ({ ...prev, [slot]: val }))}
              editable={!carouselBlocked}
            />
            <IsiInput
              label="Descripción del carrusel"
              maxLength={65}
              value={carouselDescriptions[slot] || ''}
              onChangeText={(val) => setCarouselDescriptions((prev) => ({ ...prev, [slot]: val }))}
              editable={!carouselBlocked}
            />

            <View style={styles.catalogImagesWrap}>
              {imageCount === 0 ? (
                <Pressable
                  style={styles.catalogAddSlotLarge}
                  onPress={() => addCatalogImages(slot)}
                  disabled={isUploading || saving || carouselBlocked}>
                  <Text style={styles.carouselSlotText}>+ Añadir imagen (máx 5)</Text>
                </Pressable>
              ) : (
                <View style={styles.catalogImagesGrid}>
                  {savedImages.map((img) => (
                      <View key={`saved-${img.id}`} style={styles.catalogThumb}>
                        <CatalogSavedImage
                          imageId={img.id}
                          imageUrl={img.image_url}
                          authHeaders={catalogImageAuthHeaders}
                          style={styles.catalogThumbImage}
                        />
                        <Pressable
                          style={styles.catalogRemoveBtn}
                          onPress={() => removeSavedCatalogImage(slot, img.id)}
                          disabled={isUploading || saving}
                          accessibilityLabel="Eliminar imagen">
                          <Ionicons name="close" size={18} color={IsiPlazaColors.white} />
                        </Pressable>
                      </View>
                  ))}
                  {pendingImages.map((item) => (
                    <View key={item.localId} style={styles.catalogThumb}>
                      <Image source={{ uri: item.uri }} style={styles.catalogThumbImage} contentFit="cover" />
                      <Pressable
                        style={styles.catalogRemoveBtn}
                        onPress={() => removePendingCatalogImage(slot, item.localId)}
                        disabled={isUploading || saving}
                        accessibilityLabel="Quitar imagen seleccionada">
                        <Ionicons name="close" size={18} color={IsiPlazaColors.white} />
                      </Pressable>
                    </View>
                  ))}
                  {canAddMore ? (
                    <Pressable
                      style={styles.catalogAddSlot}
                      onPress={() => addCatalogImages(slot)}
                      disabled={isUploading || saving}>
                      <Text style={styles.carouselSlotTextSmall}>+ Añadir</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              {isUploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={IsiPlazaColors.primary} size="large" />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      {formMessage ? (
        <View style={styles.formMessageBox}>
          <Text style={styles.formMessageText}>{formMessage}</Text>
        </View>
      ) : null}

      {catalogUploadProgress ? (
        <Text style={styles.catalogUploadProgress}>
          Subiendo imagen{' '}
          {Math.min(catalogUploadProgress.completed + 1, catalogUploadProgress.total)} de{' '}
          {catalogUploadProgress.total} (carrusel {catalogUploadProgress.displayOrder})…
        </Text>
      ) : null}

      <IsiButton
        label={isBusy ? 'Guardando…' : 'Guardar perfil'}
        onPress={() => {
          void handleSaveProfile();
        }}
        disabled={isBusy}
        style={styles.saveButton}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
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
  whatsappRow: {
    flexDirection: 'row',
    gap: IsiPlazaSpacing.sm,
    alignItems: 'flex-end',
  },
  whatsappPrefix: {
    width: 130,
    flexShrink: 0,
  },
  whatsappNum: {
    flex: 1,
    minWidth: 0,
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
  photoPlaceholderFilled: {
    borderStyle: 'solid',
    borderColor: IsiPlazaColors.primary,
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
  catalogUploadProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
    marginBottom: IsiPlazaSpacing.sm,
  },
  formMessageBox: {
    marginBottom: IsiPlazaSpacing.sm,
    padding: IsiPlazaSpacing.md,
    borderRadius: IsiPlazaRadius.sm,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: IsiPlazaColors.primaryMuted,
  },
  formMessageText: {
    fontSize: 13,
    color: IsiPlazaColors.primary,
    lineHeight: 18,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.text,
  },
  docHint: {
    fontSize: 12,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 16,
    marginBottom: IsiPlazaSpacing.sm,
  },
  docRow: {
    flexDirection: 'row',
    gap: IsiPlazaSpacing.md,
    marginBottom: IsiPlazaSpacing.md,
  },
  docUploadSlot: {
    flex: 1,
    minHeight: 130,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: IsiPlazaColors.primaryMuted,
    borderRadius: IsiPlazaRadius.md,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IsiPlazaSpacing.sm,
    paddingVertical: IsiPlazaSpacing.md,
    gap: 6,
  },
  docUploadSlotFilled: {
    borderStyle: 'solid',
    borderColor: IsiPlazaColors.primary,
    backgroundColor: IsiPlazaColors.white,
  },
  docUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IsiPlazaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docUploadPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    textAlign: 'center',
  },
  docUploadStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.text,
    textAlign: 'center',
  },
  docUploadAction: {
    fontSize: 11,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  docUploadSlotDisabled: {
    opacity: 0.45,
  },
  docRemoveBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: IsiPlazaRadius.sm,
    borderWidth: 1,
    borderColor: IsiPlazaColors.primary,
    backgroundColor: IsiPlazaColors.white,
  },
  docRemoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: IsiPlazaColors.primary,
  },
  catalogCardDisabled: {
    opacity: 0.5,
  },
  catalogImagesWrap: {
    position: 'relative',
    minHeight: 100,
  },
  catalogImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IsiPlazaSpacing.sm,
  },
  catalogThumb: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: IsiPlazaRadius.sm,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
  },
  catalogThumbImage: {
    width: '100%',
    height: '100%',
  },
  catalogRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  catalogAddSlotLarge: {
    height: 120,
    borderRadius: IsiPlazaRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: IsiPlazaColors.primaryMuted,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IsiPlazaSpacing.md,
  },
  catalogAddSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: IsiPlazaRadius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: IsiPlazaColors.primaryMuted,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  catalogEmptyInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: IsiPlazaSpacing.md,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderRadius: IsiPlazaRadius.md,
  },
  carouselSlotText: {
    fontSize: 16,
    color: IsiPlazaColors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  carouselSlotTextSmall: {
    fontSize: 13,
    color: IsiPlazaColors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: IsiPlazaSpacing.md,
    marginBottom: IsiPlazaSpacing.xl,
  },
});
