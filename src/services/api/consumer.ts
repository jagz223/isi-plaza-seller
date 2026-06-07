import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-storage';

import { CONSUMER_API_BASE, CONSUMER_TOKEN_STORAGE_KEY, resolveMediaUrl } from './config';
import type {
  ConsumerAuthResponse,
  ConsumerBanner,
  ConsumerSeller,
  ConsumerSellerDetail,
  ConsumerSellerDetailResponse,
  ConsumerSellersResponse,
  ConsumerUser,
  FilterCountryOption,
} from '@/types/consumer-api';
import type { BusinessCategory, SellerInteractionEventType } from '@/types/seller-api';

type BusinessCategoriesResponse = {
  data: BusinessCategory[];
};

export async function getStoredConsumerToken(): Promise<string | null> {
  return getSecureItem(CONSUMER_TOKEN_STORAGE_KEY);
}

export async function setStoredConsumerToken(token: string | null): Promise<void> {
  if (token) {
    await setSecureItem(CONSUMER_TOKEN_STORAGE_KEY, token);
  } else {
    await deleteSecureItem(CONSUMER_TOKEN_STORAGE_KEY);
  }
}

type ConsumerFetchOptions = {
  requireAuth?: boolean;
};

async function consumerFetch<T>(
  path: string,
  init?: RequestInit,
  options: ConsumerFetchOptions = {},
): Promise<T> {
  const token = await getStoredConsumerToken();
  if (options.requireAuth && !token) {
    throw new Error('No hay sesión de comprador activa.');
  }

  const res = await fetch(`${CONSUMER_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new Error('Respuesta inválida del servidor.');
    }
  }

  if (!res.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json
        ? String((json as { message?: string }).message)
        : 'Error en la solicitud.';
    throw new Error(message);
  }

  return json as T;
}

export type RegisterConsumerGuestPayload = {
  name: string;
  whatsapp: string;
};

export async function registerConsumerGuest(
  payload: RegisterConsumerGuestPayload,
): Promise<ConsumerAuthResponse> {
  return consumerFetch<ConsumerAuthResponse>('/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchConsumerMe(): Promise<ConsumerUser> {
  const json = await consumerFetch<ConsumerUser | { data: ConsumerUser }>('/me', undefined, {
    requireAuth: true,
  });
  return 'data' in json && json.data ? json.data : (json as ConsumerUser);
}

export async function signOutConsumer(): Promise<void> {
  await consumerFetch('/logout', { method: 'POST' }, { requireAuth: true });
}

export async function fetchConsumerFavorites(): Promise<ConsumerSeller[]> {
  const json = await consumerFetch<{ data: ConsumerSeller[] }>('/favorites', undefined, {
    requireAuth: true,
  });
  return (json.data ?? []).map(normalizeSeller);
}

export async function addConsumerFavorite(sellerId: number): Promise<boolean> {
  const json = await consumerFetch<{ is_favorited: boolean }>(
    `/favorites/${sellerId}`,
    { method: 'POST' },
    { requireAuth: true },
  );
  return json.is_favorited;
}

export async function removeConsumerFavorite(sellerId: number): Promise<boolean> {
  const json = await consumerFetch<{ is_favorited: boolean }>(
    `/favorites/${sellerId}`,
    { method: 'DELETE' },
    { requireAuth: true },
  );
  return json.is_favorited;
}

export async function fetchConsumerBusinessCategories(): Promise<BusinessCategory[]> {
  const json = await consumerFetch<BusinessCategoriesResponse | BusinessCategory[]>(
    '/business-categories',
  );

  if (Array.isArray(json)) {
    return json;
  }

  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchConsumerBanners(businessCategoryId?: number): Promise<ConsumerBanner[]> {
  const search = businessCategoryId ? `?business_category_id=${businessCategoryId}` : '';
  const json = await consumerFetch<{ data: ConsumerBanner[] }>(`/banners${search}`);
  return (json.data ?? []).map((b) => ({
    ...b,
    image_url: resolveMediaUrl(b.image_url) ?? b.image_url,
  }));
}

export async function recordConsumerBannerClick(bannerId: number): Promise<void> {
  await consumerFetch(`/banners/${bannerId}/click`, { method: 'POST' });
}

export async function fetchConsumerFilterCountries(): Promise<FilterCountryOption[]> {
  const json = await consumerFetch<{ data: FilterCountryOption[] }>('/filters/countries');
  return json.data ?? [];
}

export async function fetchConsumerFilterStates(country: string): Promise<string[]> {
  const params = new URLSearchParams({ country });
  const json = await consumerFetch<{ data: string[] }>(`/filters/states?${params}`);
  const raw = json.data ?? [];
  const expanded: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (typeof s === 'string' && s.length > 0) {
              expanded.push(s);
            }
          });
          continue;
        }
      } catch {
        // texto plano
      }
    }
    if (trimmed) {
      expanded.push(trimmed);
    }
  }
  return [...new Set(expanded)].sort((a, b) => a.localeCompare(b, 'es'));
}

export type FetchConsumerSellersParams = {
  businessCategoryId?: number;
  country?: string;
  state?: string;
  perPage?: number;
  page?: number;
};

function normalizeSeller(item: ConsumerSeller): ConsumerSeller {
  return {
    ...item,
    avatar_url: resolveMediaUrl(item.avatar_url) ?? item.avatar_url,
  };
}

export async function fetchConsumerSellers(
  params: FetchConsumerSellersParams = {},
): Promise<ConsumerSeller[]> {
  const search = new URLSearchParams();
  if (params.businessCategoryId != null) {
    search.set('business_category_id', String(params.businessCategoryId));
  }
  if (params.country) {
    search.set('country', params.country);
  }
  if (params.state) {
    search.set('state', params.state);
  }
  search.set('per_page', String(params.perPage ?? 50));
  if (params.page) {
    search.set('page', String(params.page));
  }

  const all: ConsumerSeller[] = [];
  let page = params.page ?? 1;
  let lastPage = 1;

  do {
    search.set('page', String(page));
    const json = await consumerFetch<ConsumerSellersResponse>(`/sellers?${search}`);
    all.push(...(json.data ?? []).map(normalizeSeller));
    lastPage = json.meta?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  return all;
}

function normalizeSellerDetail(data: ConsumerSellerDetail): ConsumerSellerDetail {
  return {
    ...data,
    avatar_url: resolveMediaUrl(data.avatar_url) ?? data.avatar_url,
    pdf_url: data.pdf_url ? (resolveMediaUrl(data.pdf_url) ?? data.pdf_url) : null,
    excel_url: data.excel_url ? (resolveMediaUrl(data.excel_url) ?? data.excel_url) : null,
    catalog_images: (data.catalog_images ?? []).map((img) => ({
      ...img,
      image_url: resolveMediaUrl(img.image_url) ?? img.image_url,
    })),
  };
}

export async function fetchConsumerSeller(sellerId: number): Promise<ConsumerSellerDetail> {
  const json = await consumerFetch<ConsumerSellerDetailResponse | ConsumerSellerDetail>(
    `/sellers/${sellerId}`,
  );
  const data = 'data' in json && json.data ? json.data : (json as ConsumerSellerDetail);
  return normalizeSellerDetail(data);
}

/** Registra clic en WhatsApp o web del mayorista (métricas mensuales). No bloquea la UI si falla. */
export function recordConsumerSellerInteraction(
  sellerId: number,
  eventType: SellerInteractionEventType,
): void {
  void consumerFetch(`/sellers/${sellerId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType }),
  }).catch(() => {
    // Las métricas no deben impedir abrir el enlace.
  });
}
