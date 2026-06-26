import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CatalogSavedImage } from '@/components/CatalogSavedImage';
import {
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
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredToken } from '@/services/api/client';
import { resolveMediaUrl } from '@/services/api/config';
import { formatValidationErrors } from '@/services/api/errors';
import {
  buildProfileFormData,
  buildProfilePatchBody,
  deleteCatalogImage,
  fetchCatalogImages,
  fetchProfile,
  patchProfileFormData,
  patchProfileJson,
} from '@/services/api/seller';
import {
  applyCatalogUploadResultToPending,
  buildCatalogUploadQueue,
  CATALOG_MAX_IMAGES_PER_CAROUSEL,
  formatCatalogUploadFailureMessage,
  type PendingCatalogImage,
  uploadCatalogImageQueue,
  validateCatalogUploadLimits,
} from '@/services/catalog-upload';
import { validateProfileFormBeforeSave } from '@/services/profile-form-validation';
import { showUserMessage } from '@/utils/show-user-message';
import { getCurrentCoordinates } from '@/utils/location';
import type { CatalogImage, SellerUser } from '@/types/seller-api';

/** Un solo carrusel de fotos del consultorio (display_order = 1 en API). */
const PROFILE_PHOTOS_SLOT = 1;
const MAX_PROFILE_PHOTOS = CATALOG_MAX_IMAGES_PER_CAROUSEL;

function newLocalPhotoId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PerfilScreen() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState<string[]>([]);
  const [whatsappDialCode, setWhatsappDialCode] = useState(DEFAULT_WHATSAPP_DIAL_CODE);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [professionalLicense, setProfessionalLicense] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);

  const [savedPhotos, setSavedPhotos] = useState<CatalogImage[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingCatalogImage[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [catalogAuthToken, setCatalogAuthToken] = useState<string | null>(null);

  useEffect(() => {
    void getStoredToken().then(setCatalogAuthToken);
  }, []);

  const photoAuthHeaders = useMemo(
    () => (catalogAuthToken ? { Authorization: `Bearer ${catalogAuthToken}` } : {}),
    [catalogAuthToken],
  );

  const photoCount = savedPhotos.length + pendingPhotos.length;

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

    setProfessionalLicense(sp?.professional_license ?? '');
    setPhone(sp?.phone ?? '');
    setAddress(sp?.address ?? '');
    setMunicipality(sp?.municipality ?? '');
    setLatitude(sp?.latitude ?? null);
    setLongitude(sp?.longitude ?? null);
    setAvatarUrl(sp?.avatar_url ?? null);
    setCategoryId(sp?.business_category_id ?? sp?.business_category?.id ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, images] = await Promise.all([fetchProfile(), fetchCatalogImages()]);
      applyProfileToForm(profile);
      setSavedPhotos(images.filter((img) => img.display_order === PROFILE_PHOTOS_SLOT));
      setPendingAvatarUri(null);
      setPendingPhotos([]);
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [applyProfileToForm]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const handlePickAvatar = async () => {
    const uris = await pickImages(1);
    if (uris[0]) setPendingAvatarUri(uris[0]);
  };

  const addProfilePhotos = async () => {
    const remaining = MAX_PROFILE_PHOTOS - photoCount;
    if (remaining <= 0) {
      Alert.alert('Límite alcanzado', `Solo puedes tener hasta ${MAX_PROFILE_PHOTOS} fotos en el carrusel.`);
      return;
    }

    const uris = await pickImages(remaining);
    if (uris.length === 0) return;

    setPendingPhotos((prev) => [
      ...prev,
      ...uris.map((uri) => ({ localId: newLocalPhotoId(), uri })),
    ]);
  };

  const removePendingPhoto = (localId: string) => {
    setPendingPhotos((prev) => prev.filter((item) => item.localId !== localId));
  };

  const removeSavedPhoto = async (imageId: number) => {
    setUploadingPhotos(true);
    try {
      await deleteCatalogImage(imageId);
      setSavedPhotos((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert('Error', e.message ?? 'No se pudo eliminar la imagen.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const uploadPendingPhotos = useCallback(async (): Promise<string | null> => {
    if (pendingPhotos.length === 0) return null;

    const pendingBySlot = { [PROFILE_PHOTOS_SLOT]: pendingPhotos };
    const jobs = buildCatalogUploadQueue(pendingBySlot);

    const savedCountBySlot = new Map([[PROFILE_PHOTOS_SLOT, savedPhotos.length]]);
    const limitError = validateCatalogUploadLimits(
      savedPhotos.length,
      pendingBySlot,
      savedCountBySlot,
    );
    if (limitError) return limitError;

    setUploadProgress({ completed: 0, total: jobs.length });
    setUploadingPhotos(true);

    const result = await uploadCatalogImageQueue(jobs, (progress) => {
      setUploadProgress({ completed: progress.completed, total: progress.total });
    });

    setUploadProgress(null);
    setUploadingPhotos(false);

    if (result.uploaded.length > 0) {
      setSavedPhotos((prev) => [...prev, ...result.uploaded]);
    }

    const remaining = applyCatalogUploadResultToPending(pendingBySlot, result)[PROFILE_PHOTOS_SLOT] ?? [];
    setPendingPhotos(remaining);

    if (result.failures.length > 0) {
      return formatCatalogUploadFailureMessage(result.failures);
    }

    return null;
  }, [pendingPhotos, savedPhotos.length]);

  const handleSaveProfile = useCallback(async () => {
    setFormMessage(null);
    setSaving(true);

    try {
      const validationError = validateProfileFormBeforeSave({
        businessName,
        description,
        country,
        state,
        whatsappDialCode,
        whatsappNumber,
        savedPhotoCount: savedPhotos.length,
        pendingPhotoCount: pendingPhotos.length,
      });

      if (validationError) {
        setFormMessage(validationError);
        showUserMessage('Revisa tu información', validationError);
        return;
      }

      const fullWhatsapp = formatWhatsapp(whatsappDialCode, whatsappNumber);

      const body = buildProfilePatchBody({
        name: businessName,
        business_category_id: categoryId,
        description,
        country,
        state,
        whatsapp: fullWhatsapp,
        instagram: '',
        facebook: '',
        website: '',
        professional_license: professionalLicense,
        phone,
        address,
        municipality,
        latitude,
        longitude,
      });

      if (pendingPhotos.length > 0) {
        const uploadError = await uploadPendingPhotos();
        if (uploadError) {
          setFormMessage(uploadError);
          showUserMessage('Fotos del consultorio', uploadError);
          return;
        }
      }

      if (pendingAvatarUri) {
        const formData = await buildProfileFormData(body, {
          avatarUri: pendingAvatarUri,
          pdf: null,
          excel: null,
          carouselMetadata: [],
        });
        await patchProfileFormData(formData);
      } else {
        await patchProfileJson(body);
      }

      setPendingAvatarUri(null);
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
      setUploadProgress(null);
      setUploadingPhotos(false);
    }
  }, [
    businessName,
    categoryId,
    description,
    country,
    state,
    whatsappDialCode,
    whatsappNumber,
    savedPhotos.length,
    pendingPhotos.length,
    pendingAvatarUri,
    uploadPendingPhotos,
    refreshSession,
    load,
    professionalLicense,
    phone,
    address,
    municipality,
    latitude,
    longitude,
  ]);

  if (loading) {
    return <LoadingOverlay />;
  }

  const displayAvatar = pendingAvatarUri ?? resolveMediaUrl(avatarUrl) ?? avatarUrl;
  const isBusy = saving || uploadingPhotos || uploadProgress !== null;
  const canAddMorePhotos = photoCount < MAX_PROFILE_PHOTOS;

  return (
    <View style={styles.screenRoot}>
      {isBusy ? <LoadingOverlay message="Guardando perfil…" variant="overlay" /> : null}
      <IsiScreen contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Esta es la información que verán los pacientes</Text>

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
            <View style={styles.emptyInner}>
              <Ionicons name="add-circle-outline" size={36} color={IsiPlazaColors.primary} />
              <Text style={styles.photoPlaceholderText}>+ Añadir foto de perfil</Text>
            </View>
          )}
        </Pressable>

        <IsiSectionTitle>Datos del consultorio</IsiSectionTitle>
        <View style={styles.fields}>
          <IsiInput
            label="Nombre comercial"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
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

        <IsiSectionTitle>Datos profesionales</IsiSectionTitle>
        <View style={styles.fields}>
          <IsiInput
            label="Cédula profesional"
            value={professionalLicense}
            onChangeText={setProfessionalLicense}
            autoCapitalize="characters"
          />
          <IsiInput
            label="Celular"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <IsiInput label="Dirección del consultorio" value={address} onChangeText={setAddress} />
          <IsiInput label="Municipio / alcaldía" value={municipality} onChangeText={setMunicipality} />
          <IsiButton
            label={
              latitude != null && longitude != null
                ? `Ubicación guardada (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                : 'Usar mi ubicación actual'
            }
            variant="outline"
            onPress={() => {
              void (async () => {
                const coords = await getCurrentCoordinates();
                if (coords) {
                  setLatitude(coords.latitude);
                  setLongitude(coords.longitude);
                }
              })();
            }}
          />
        </View>

        <IsiSectionTitle>Carrusel de fotos del consultorio</IsiSectionTitle>
        <Text style={styles.hint}>
          Sube hasta {MAX_PROFILE_PHOTOS} fotos. Los pacientes las verán en un carrusel en tu perfil
          público. Se guardan al pulsar Guardar perfil.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}>
          {savedPhotos.map((img) => (
            <View key={`saved-${img.id}`} style={styles.carouselSlide}>
              <CatalogSavedImage
                imageId={img.id}
                imageUrl={img.image_url}
                authHeaders={photoAuthHeaders}
                style={styles.carouselImage}
              />
              <Pressable
                style={styles.removeBtn}
                onPress={() => void removeSavedPhoto(img.id)}
                disabled={isBusy}>
                <Ionicons name="close" size={18} color={IsiPlazaColors.white} />
              </Pressable>
            </View>
          ))}
          {pendingPhotos.map((item) => (
            <View key={item.localId} style={styles.carouselSlide}>
              <Image source={{ uri: item.uri }} style={styles.carouselImage} contentFit="cover" />
              <Pressable
                style={styles.removeBtn}
                onPress={() => removePendingPhoto(item.localId)}
                disabled={isBusy}>
                <Ionicons name="close" size={18} color={IsiPlazaColors.white} />
              </Pressable>
            </View>
          ))}
          {canAddMorePhotos ? (
            <Pressable
              style={styles.carouselAdd}
              onPress={() => void addProfilePhotos()}
              disabled={isBusy}>
              {uploadingPhotos ? (
                <ActivityIndicator color={IsiPlazaColors.primary} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={32} color={IsiPlazaColors.primary} />
                  <Text style={styles.carouselAddText}>Añadir</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </ScrollView>

        <IsiSectionTitle>Contacto</IsiSectionTitle>
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
                label="WhatsApp (máx 12)"
                value={whatsappNumber}
                onChangeText={(text) => setWhatsappNumber(text.replace(/\s/g, ''))}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          </View>
          <Text style={styles.nameHint}>
            Los pacientes podrán contactarte por WhatsApp desde tu perfil público.
          </Text>
        </View>

        {formMessage ? (
          <View style={styles.formMessageBox}>
            <Text style={styles.formMessageText}>{formMessage}</Text>
          </View>
        ) : null}

        {uploadProgress ? (
          <Text style={styles.uploadProgress}>
            Subiendo foto {Math.min(uploadProgress.completed + 1, uploadProgress.total)} de{' '}
            {uploadProgress.total}…
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
  hint: {
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 18,
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
  emptyInner: {
    alignItems: 'center',
    gap: IsiPlazaSpacing.xs,
  },
  photoPlaceholderText: {
    color: IsiPlazaColors.primary,
    fontWeight: '600',
  },
  carouselContent: {
    gap: IsiPlazaSpacing.sm,
    paddingVertical: IsiPlazaSpacing.xs,
  },
  carouselSlide: {
    width: 160,
    height: 120,
    borderRadius: IsiPlazaRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselAdd: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: IsiPlazaColors.primaryMuted,
    borderRadius: IsiPlazaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  carouselAddText: {
    color: IsiPlazaColors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formMessageBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: IsiPlazaRadius.sm,
    padding: IsiPlazaSpacing.md,
  },
  formMessageText: {
    color: '#991B1B',
    fontSize: 14,
  },
  uploadProgress: {
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: IsiPlazaSpacing.sm,
    marginBottom: IsiPlazaSpacing.lg,
  },
});
