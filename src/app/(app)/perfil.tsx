import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatalogSavedImage } from '@/components/CatalogSavedImage';
import {
  DoctorFieldCard,
  DoctorSaveButton,
  DoctorServicesTab,
  DoctorTabSwitcher,
  type DoctorTab,
} from '@/components/doctor';
import { LoadingOverlay, SearchableSelect } from '@/components/isi-plaza';
import {
  COUNTRY_NAMES,
  DEFAULT_WHATSAPP_DIAL_CODE,
  formatWhatsapp,
  getCountryByName,
  getDialCodeOptions,
  getStatesForCountry,
  parseWhatsapp,
} from '@/constants/location-data';
import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';
import { isMexicoCountry } from '@/constants/geo-mexico';
import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';
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
import { loadMunicipalityOptions } from '@/utils/geo-municipalities';
import { showUserMessage } from '@/utils/show-user-message';
import { getCurrentCoordinates } from '@/utils/location';
import type { SelectOption } from '@/components/isi-plaza/SearchableSelect';
import type { CatalogImage, SellerUser } from '@/types/seller-api';

/** Un solo carrusel de fotos del consultorio (display_order = 1 en API). */
const PROFILE_PHOTOS_SLOT = 1;
const MAX_PROFILE_PHOTOS = CATALOG_MAX_IMAGES_PER_CAROUSEL;

function newLocalPhotoId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function PerfilScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<DoctorTab>(
    params.tab === 'servicios' ? 'servicios' : 'perfil',
  );
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
  const [municipalityOptions, setMunicipalityOptions] = useState<SelectOption[]>([]);
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
    setMunicipality('');
    const meta = getCountryByName(name);
    if (meta) {
      setWhatsappDialCode(meta.dialCode);
    }
    setState((prev) => {
      const allowed = getStatesForCountry(name);
      return prev.filter((s) => allowed.includes(s));
    });
  }, []);

  const handleStateChange = useCallback((values: string[]) => {
    setState(values);
    setMunicipality('');
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadMunicipalityOptions(country, state)
      .then((options) => {
        if (!cancelled) {
          setMunicipalityOptions(options);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMunicipalityOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [country, state]);

  useEffect(() => {
    if (!municipality || municipalityOptions.length === 0) {
      return;
    }
    const isValid = municipalityOptions.some((option) => option.value === municipality);
    if (!isValid) {
      setMunicipality('');
    }
  }, [municipality, municipalityOptions]);

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

  useEffect(() => {
    if (params.tab === 'servicios') {
      setActiveTab('servicios');
    }
  }, [params.tab]);

  const photoSlots = useMemo(() => {
    type Slot =
      | { kind: 'saved'; id: number }
      | { kind: 'pending'; localId: string; uri: string }
      | { kind: 'empty'; index: number };

    const slots: Slot[] = [];
    savedPhotos.forEach((img) => slots.push({ kind: 'saved', id: img.id }));
    pendingPhotos.forEach((p) => slots.push({ kind: 'pending', localId: p.localId, uri: p.uri }));
    let emptyIndex = slots.length + 1;
    while (slots.length < MAX_PROFILE_PHOTOS) {
      slots.push({ kind: 'empty', index: emptyIndex });
      emptyIndex += 1;
    }
    return slots.slice(0, MAX_PROFILE_PHOTOS);
  }, [savedPhotos, pendingPhotos]);

  if (loading) {
    return <LoadingOverlay />;
  }

  const displayAvatar = pendingAvatarUri ?? resolveMediaUrl(avatarUrl) ?? avatarUrl;
  const isBusy = saving || uploadingPhotos || uploadProgress !== null;
  const canAddMorePhotos = photoCount < MAX_PROFILE_PHOTOS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {isBusy ? <LoadingOverlay message="Guardando perfil…" variant="overlay" /> : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DAR DE ALTA EL PERFIL</Text>
          <Text style={styles.headerSubtitle}>Perfil y servicios.</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <DoctorTabSwitcher active={activeTab} onChange={setActiveTab} />

          {activeTab === 'servicios' ? (
            <DoctorServicesTab />
          ) : (
            <View style={styles.profileContent}>
              {user?.seller_profile?.is_verified ? (
                <Text style={styles.badge}>✓ Cuenta verificada</Text>
              ) : null}

              <DoctorFieldCard label="Nombre">
                <TextInput
                  style={styles.fieldInput}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                  placeholder="Tu nombre"
                  placeholderTextColor={DoctorUIColors.textMuted}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="Cédula profesional">
                <TextInput
                  style={styles.fieldInput}
                  value={professionalLicense}
                  onChangeText={setProfessionalLicense}
                  autoCapitalize="characters"
                  placeholder="1234567"
                  placeholderTextColor={DoctorUIColors.textMuted}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="Celular">
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={DoctorUIColors.textMuted}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="País">
                <SearchableSelect
                  label=""
                  placeholder="Seleccionar país"
                  options={countryOptions}
                  value={country || undefined}
                  onChange={handleCountryChange}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="Provincia / Estado">
                <SearchableSelect
                  label=""
                  placeholder="Seleccionar"
                  options={stateOptions}
                  values={state}
                  onChangeMultiple={handleStateChange}
                  multiple
                  disabled={!country}
                />
                {!country ? (
                  <Text style={styles.fieldHint}>Selecciona un país primero.</Text>
                ) : null}
              </DoctorFieldCard>

              <DoctorFieldCard label="Descripción">
                <TextInput
                  style={[styles.fieldInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={100}
                  placeholder="Breve descripción del consultorio"
                  placeholderTextColor={DoctorUIColors.textMuted}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="Dirección del consultorio">
                <TextInput
                  style={styles.fieldInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Calle y número"
                  placeholderTextColor={DoctorUIColors.textMuted}
                />
              </DoctorFieldCard>

              <DoctorFieldCard label="Municipio / alcaldía">
                {municipalityOptions.length > 0 ? (
                  <SearchableSelect
                    label=""
                    placeholder="Seleccionar municipio o alcaldía"
                    options={municipalityOptions}
                    value={municipality || undefined}
                    onChange={setMunicipality}
                    disabled={!country || state.length === 0}
                  />
                ) : (
                  <TextInput
                    style={styles.fieldInput}
                    value={municipality}
                    onChangeText={setMunicipality}
                    placeholder="Municipio o alcaldía"
                    placeholderTextColor={DoctorUIColors.textMuted}
                    editable={Boolean(country && state.length > 0)}
                  />
                )}
                {!country || state.length === 0 ? (
                  <Text style={styles.fieldHint}>Selecciona país y estado primero.</Text>
                ) : isMexicoCountry(country) && municipalityOptions.length === 0 ? (
                  <Text style={styles.fieldHint}>
                    Catálogo disponible para Ciudad de México y Estado de México.
                  </Text>
                ) : null}
              </DoctorFieldCard>

              <Text style={styles.photosLabel}>Fotos (opcional)</Text>
              <View style={styles.photoGrid}>
                {photoSlots.map((slot) => {
                  if (slot.kind === 'saved') {
                    const img = savedPhotos.find((i) => i.id === slot.id);
                    if (!img) return null;
                    return (
                      <View key={`saved-${img.id}`} style={styles.photoSlot}>
                        <CatalogSavedImage
                          imageId={img.id}
                          imageUrl={img.image_url}
                          authHeaders={photoAuthHeaders}
                          style={styles.photoImage}
                        />
                        <Pressable
                          style={styles.photoRemove}
                          onPress={() => void removeSavedPhoto(img.id)}
                          disabled={isBusy}>
                          <Ionicons name="close" size={16} color={DoctorUIColors.white} />
                        </Pressable>
                      </View>
                    );
                  }
                  if (slot.kind === 'pending') {
                    return (
                      <View key={slot.localId} style={styles.photoSlot}>
                        <Image source={{ uri: slot.uri }} style={styles.photoImage} contentFit="cover" />
                        <Pressable
                          style={styles.photoRemove}
                          onPress={() => removePendingPhoto(slot.localId)}
                          disabled={isBusy}>
                          <Ionicons name="close" size={16} color={DoctorUIColors.white} />
                        </Pressable>
                      </View>
                    );
                  }
                  return (
                    <Pressable
                      key={`empty-${slot.index}`}
                      style={styles.photoSlotEmpty}
                      onPress={() => void addProfilePhotos()}
                      disabled={isBusy || !canAddMorePhotos}>
                      <Text style={styles.photoSlotText}>Elegir foto {slot.index}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.avatarRow} onPress={handlePickAvatar} disabled={isBusy}>
                {displayAvatar ? (
                  <Image source={{ uri: displayAvatar }} style={styles.avatarThumb} contentFit="cover" />
                ) : (
                  <View style={styles.avatarThumbEmpty}>
                    <Ionicons name="person" size={28} color={DoctorUIColors.primary} />
                  </View>
                )}
                <Text style={styles.avatarLabel}>Foto de perfil</Text>
              </Pressable>

              <DoctorFieldCard label="WhatsApp">
                <View style={styles.whatsappRow}>
                  <View style={styles.dialWrap}>
                    <SearchableSelect
                      label=""
                      placeholder="Prefijo"
                      options={dialCodeOptions}
                      value={whatsappDialCode}
                      onChange={setWhatsappDialCode}
                      compact
                    />
                  </View>
                  <TextInput
                    style={[styles.fieldInput, styles.whatsappInput]}
                    value={whatsappNumber}
                    onChangeText={(text) => setWhatsappNumber(text.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={12}
                    placeholder="Número"
                    placeholderTextColor={DoctorUIColors.textMuted}
                  />
                </View>
              </DoctorFieldCard>

              <Pressable
                style={styles.locationBtn}
                onPress={() => {
                  void (async () => {
                    const coords = await getCurrentCoordinates();
                    if (coords) {
                      setLatitude(coords.latitude);
                      setLongitude(coords.longitude);
                    }
                  })();
                }}
                disabled={isBusy}>
                <Text style={styles.locationBtnText}>
                  {latitude != null && longitude != null
                    ? `Ubicación guardada (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                    : 'Usar mi ubicación actual'}
                </Text>
              </Pressable>

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

              <DoctorSaveButton
                label={isBusy ? 'Guardando…' : 'Guardar perfil'}
                onPress={() => void handleSaveProfile()}
                disabled={isBusy}
                loading={isBusy}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DoctorUIColors.screen,
  },
  header: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingTop: IsiPlazaSpacing.sm,
    paddingBottom: IsiPlazaSpacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DoctorUIColors.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: DoctorUIColors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: IsiPlazaSpacing.lg,
    paddingBottom: IsiPlazaSpacing.xl,
  },
  panel: {
    backgroundColor: DoctorUIColors.panel,
    borderRadius: DoctorUIRadius.panel,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
    minHeight: 400,
  },
  profileContent: {
    gap: IsiPlazaSpacing.sm,
  },
  badge: {
    textAlign: 'center',
    color: IsiPlazaColors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '600',
    color: DoctorUIColors.primary,
    paddingVertical: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: DoctorUIColors.textMuted,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: DoctorUIColors.primary,
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoSlot: {
    width: '47%',
    aspectRatio: 1.35,
    borderRadius: DoctorUIRadius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: DoctorUIColors.white,
  },
  photoSlotEmpty: {
    width: '47%',
    aspectRatio: 1.35,
    borderRadius: DoctorUIRadius.card,
    backgroundColor: DoctorUIColors.slot,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  photoSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: DoctorUIColors.primary,
    textAlign: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  avatarThumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DoctorUIColors.white,
  },
  avatarThumbEmpty: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DoctorUIColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DoctorUIColors.primary,
  },
  whatsappRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialWrap: {
    width: 108,
    flexShrink: 0,
  },
  whatsappInput: {
    flex: 1,
    minWidth: 0,
  },
  locationBtn: {
    backgroundColor: DoctorUIColors.white,
    borderRadius: DoctorUIRadius.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: DoctorUIColors.primary,
  },
  formMessageBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: IsiPlazaSpacing.md,
  },
  formMessageText: {
    color: '#991B1B',
    fontSize: 14,
  },
  uploadProgress: {
    fontSize: 13,
    color: DoctorUIColors.textMuted,
    textAlign: 'center',
  },
});
