import type {
  AuthResponse,
  BusinessCategory,
  BusinessCategoriesResponse,
  CatalogImage,
  CatalogImagesResponse,
  MeResponse,
  MetricsResponse,
  ProfileResponse,
  SettingsResponse,
  SubscriptionResponse,
} from '@/types/seller-api';

import { imageUriToBase64Payload } from '@/utils/image-base64';

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
  business_category_id?: number;
  description?: string;
  country?: string;
  state?: string | string[];
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  avatar_base64?: string;
  avatar_mime_type?: string;
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

export async function fetchProfile() {
  const res = await apiRequest<ProfileResponse>('/profile');
  return res.data;
}

/** Body en snake_case para PATCH /profile (tabla seller_profiles). No incluye users.name. */
export function buildProfilePatchBody(fields: {
  business_category_id: number;
  description: string;
  country: string;
  state: string | string[];
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
}): ProfilePatchPayload {
  const body: ProfilePatchPayload = {
    business_category_id: Number(fields.business_category_id),
    description: fields.description.trim(),
    country: fields.country.trim(),
    state: Array.isArray(fields.state) ? fields.state : fields.state.trim(),
  };
  const whatsapp = fields.whatsapp.trim();
  const instagram = fields.instagram.trim();
  const facebook = fields.facebook.trim();
  const website = fields.website.trim();
  if (whatsapp) body.whatsapp = whatsapp;
  if (instagram) body.instagram = instagram;
  if (facebook) body.facebook = facebook;
  if (website) body.website = website;
  return body;
}

/** URI local de imagen elegida en el dispositivo (galería). */
export function isLocalImageUri(uri: string | null | undefined): uri is string {
  if (!uri || typeof uri !== 'string') return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

/**
 * PATCH /profile — siempre application/json (instrucciones admin §3, §5–6).
 * Texto + avatar_base64 en un solo request si se incluyen campos de avatar.
 */
export async function patchProfileJson(payload: ProfilePatchPayload) {
  const res = await apiRequest<ProfileResponse>('/profile', {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

/** Avatar vía JSON Base64 (recomendado por backend). */
export async function patchProfileWithAvatar(
  payload: ProfilePatchPayload,
  avatarUri: string,
) {
  const { base64, mime_type } = await imageUriToBase64Payload(avatarUri);
  return patchProfileJson({
    ...payload,
    avatar_base64: base64,
    avatar_mime_type: mime_type,
  });
}

/** 
 * Enviar perfil usando FormData (para archivos grandes como PDF o Excel).
 * Se envía como POST con _method=PATCH para compatibilidad con Laravel.
 */
export async function patchProfileFormData(formData: FormData) {
  formData.append('_method', 'PATCH');
  const res = await apiRequest<ProfileResponse>('/profile', {
    method: 'POST',
    body: formData,
  });
  return res.data;
}

export async function fetchCatalogImages() {
  const res = await apiRequest<CatalogImagesResponse>('/catalog-images');
  return res.data;
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

/**
 * POST /catalog-images — JSON Base64 (instrucciones admin §7).
 */
export async function uploadCatalogImage(uri: string, displayOrder: number) {
  const { base64, mime_type } = await imageUriToBase64Payload(uri);

  const res = await apiRequest<unknown>('/catalog-images', {
    method: 'POST',
    body: {
      display_order: displayOrder,
      image_base64: base64,
      mime_type,
    },
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
