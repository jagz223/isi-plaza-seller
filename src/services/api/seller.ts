import type {
  AuthResponse,
  BusinessCategory,
  BusinessCategoriesResponse,
  CatalogImage,
  CatalogImagesResponse,
  DoctorServiceItem,
  MeResponse,
  MetricsResponse,
  ProfileResponse,
  SettingsResponse,
  SubscriptionResponse,
  TreatmentSection,
} from '@/types/seller-api';

import {
  appendExcelToFormData,
  appendPdfToFormData,
  mimeTypeForDocumentName,
  prepareExcelForMultipart,
  preparePdfForMultipart,
} from '@/utils/prepare-document-upload';
import { appendPreparedImageToFormData, prepareImageForMultipart } from '@/utils/prepare-image-upload';

import { apiRequest, setStoredToken } from './client';
import { resolveMediaUrl } from './config';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ProfilePatchPayload = {
  name?: string;
  business_category_id?: number;
  description?: string;
  country?: string;
  state?: string | string[];
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  carousel_metadata?: { title: string; description: string }[];
  professional_license?: string;
  phone?: string;
  address?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;
};

export type PasswordPatchPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export async function register(payload: RegisterPayload) {
  const res = await apiRequest<AuthResponse>('/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
  await setStoredToken(res.token);
  return res;
}

export async function login(payload: LoginPayload) {
  const res = await apiRequest<AuthResponse>('/login', {
    method: 'POST',
    auth: false,
    body: payload,
  });
  await setStoredToken(res.token);
  return res;
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export async function logout() {
  try {
    await apiRequest<{ message: string }>('/logout', { method: 'POST' });
  } finally {
    await setStoredToken(null);
  }
}

export async function fetchMe() {
  const res = await apiRequest<MeResponse>('/me');
  return res.data;
}

export async function fetchSubscription() {
  return apiRequest<SubscriptionResponse>('/subscription');
}

function normalizeCategoriesList(
  res: BusinessCategoriesResponse | BusinessCategory[] | { data?: BusinessCategory[] },
): BusinessCategory[] {
  if (Array.isArray(res)) {
    return res;
  }
  if (Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

export async function fetchBusinessCategories() {
  const res = await apiRequest<
    BusinessCategoriesResponse | BusinessCategory[] | { data?: BusinessCategory[] }
  >('/business-categories', { auth: false });
  return normalizeCategoriesList(res);
}

export async function fetchSellerTreatments(): Promise<TreatmentSection[]> {
  const res = await apiRequest<{ data: TreatmentSection[] }>('/treatments', { auth: false });
  return res.data ?? [];
}

export async function syncDoctorServices(
  services: { treatment_id: number; price: number }[],
): Promise<ProfileResponse['data']> {
  const res = await apiRequest<ProfileResponse>('/doctor-services', {
    method: 'PUT',
    body: { services },
  });
  return res.data;
}

export async function fetchDoctorServices(): Promise<DoctorServiceItem[]> {
  const res = await apiRequest<{ data: DoctorServiceItem[] }>('/doctor-services');
  return res.data ?? [];
}

export async function fetchProfile() {
  const res = await apiRequest<ProfileResponse>('/profile');
  return res.data;
}

/** Body en snake_case para PATCH /profile (users.name + seller_profiles). */
export function buildProfilePatchBody(fields: {
  name: string;
  business_category_id?: number | null;
  description: string;
  country: string;
  state: string | string[];
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
  professional_license?: string;
  phone?: string;
  address?: string;
  municipality?: string;
  latitude?: number | null;
  longitude?: number | null;
}): ProfilePatchPayload {
  const body: ProfilePatchPayload = {
    name: fields.name.trim(),
    description: fields.description.trim(),
    country: fields.country.trim(),
    state: Array.isArray(fields.state) ? fields.state : fields.state.trim(),
  };
  if (fields.business_category_id != null) {
    body.business_category_id = Number(fields.business_category_id);
  }
  const whatsapp = fields.whatsapp.trim();
  const instagram = fields.instagram.trim();
  const facebook = fields.facebook.trim();
  const website = fields.website.trim();
  if (whatsapp) body.whatsapp = whatsapp;
  if (instagram) body.instagram = instagram;
  if (facebook) body.facebook = facebook;
  if (website) body.website = website;
  const license = fields.professional_license?.trim();
  const phone = fields.phone?.trim();
  const address = fields.address?.trim();
  const municipality = fields.municipality?.trim();
  if (license) body.professional_license = license;
  if (phone) body.phone = phone;
  if (address) body.address = address;
  if (municipality) body.municipality = municipality;
  if (fields.latitude != null) body.latitude = fields.latitude;
  if (fields.longitude != null) body.longitude = fields.longitude;
  return body;
}

/** URI local de imagen elegida en el dispositivo (galería). */
export function isLocalImageUri(uri: string | null | undefined): uri is string {
  if (!uri || typeof uri !== 'string') return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:')
  );
}

export async function deleteSellerProfilePdf(): Promise<SellerUser> {
  const res = await apiRequest<ProfileResponse>('/profile/pdf', { method: 'DELETE' });
  return res.data;
}

export async function deleteSellerProfileExcel(): Promise<SellerUser> {
  const res = await apiRequest<ProfileResponse>('/profile/excel', { method: 'DELETE' });
  return res.data;
}

export async function patchProfileJson(payload: ProfilePatchPayload) {
  const res = await apiRequest<ProfileResponse>('/profile', {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

/**
 * Perfil con archivos (avatar, PDF, Excel) vía multipart.
 * POST + _method=PATCH para compatibilidad con Laravel.
 */
export async function patchProfileFormData(formData: FormData) {
  formData.append('_method', 'PATCH');
  const res = await apiRequest<ProfileResponse>('/profile', {
    method: 'POST',
    body: formData,
  });
  return res.data;
}

export async function buildProfileFormData(
  payload: ProfilePatchPayload,
  options?: {
    avatarUri?: string | null;
    pdf?: { uri: string; name: string; type: string } | null;
    excel?: { uri: string; name: string; type: string } | null;
    carouselMetadata?: { title: string; description: string }[];
  },
): Promise<FormData> {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'state' && Array.isArray(value)) {
      value.forEach((s) => formData.append('state[]', s));
      return;
    }
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  options?.carouselMetadata?.forEach((meta, idx) => {
    formData.append(`carousel_metadata[${idx}][title]`, meta.title);
    formData.append(`carousel_metadata[${idx}][description]`, meta.description);
  });

  if (options?.pdf) {
    const prepared = await preparePdfForMultipart({
      uri: options.pdf.uri,
      name: options.pdf.name,
      type: mimeTypeForDocumentName(options.pdf.name, options.pdf.type),
    });
    appendPdfToFormData(formData, prepared);
  }

  if (options?.excel) {
    const prepared = await prepareExcelForMultipart({
      uri: options.excel.uri,
      name: options.excel.name,
      type: mimeTypeForDocumentName(options.excel.name, options.excel.type),
    });
    appendExcelToFormData(formData, prepared);
  }

  if (options?.avatarUri && isLocalImageUri(options.avatarUri)) {
    const prepared = await prepareImageForMultipart(options.avatarUri);
    appendPreparedImageToFormData(formData, 'avatar', prepared);
  }

  return formData;
}

export async function fetchCatalogImages(): Promise<CatalogImage[]> {
  const res = await apiRequest<CatalogImagesResponse | CatalogImage[]>('/catalog-images');

  if (Array.isArray(res)) {
    return res.map((item) => ({
      ...item,
      image_url: resolveMediaUrl(item.image_url) ?? item.image_url,
    }));
  }

  const list = res.data ?? [];
  return list.map((item) => ({
    ...item,
    image_url: resolveMediaUrl(item.image_url) ?? item.image_url,
  }));
}

function normalizeCatalogImage(raw: unknown, displayOrder: number): CatalogImage {
  if (raw && typeof raw === 'object') {
    const item = 'data' in (raw as object) ? (raw as { data: CatalogImage }).data : (raw as CatalogImage);
    if (item?.image_url) {
      const url = resolveMediaUrl(item.image_url) ?? item.image_url;
      return {
        id: item.id ?? 0,
        image_url: url,
        display_order: item.display_order ?? displayOrder,
      };
    }
  }
  throw new Error('Respuesta de catálogo sin image_url');
}

/** POST /catalog-images — multipart; Laravel sube a Firebase Storage. */
export async function uploadCatalogImage(uri: string, displayOrder: number) {
  const prepared = await prepareImageForMultipart(uri);
  const formData = new FormData();
  formData.append('display_order', String(displayOrder));
  appendPreparedImageToFormData(formData, 'image', prepared);

  const res = await apiRequest<unknown>('/catalog-images', {
    method: 'POST',
    body: formData,
  });
  return normalizeCatalogImage(res, displayOrder);
}

export async function deleteCatalogImage(id: number) {
  await apiRequest<void>(`/catalog-images/${id}`, { method: 'DELETE' });
}

export async function fetchMetrics() {
  return apiRequest<MetricsResponse>('/metrics');
}

export async function fetchSettings() {
  return apiRequest<SettingsResponse>('/settings');
}

export async function patchPassword(payload: PasswordPatchPayload) {
  return apiRequest<{ message: string }>('/settings/password', {
    method: 'PATCH',
    body: payload,
  });
}

export function userHasAccess(user: { has_access?: boolean; seller_profile?: { access_status?: string } | null }) {
  if (user.has_access === true) return true;
  return user.seller_profile?.access_status === 'active';
}
