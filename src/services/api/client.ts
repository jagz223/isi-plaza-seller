import type { ApiErrorBody } from '@/types/seller-api';

import { SELLER_API_BASE, TOKEN_STORAGE_KEY } from './config';
import { ApiError } from './errors';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secure-storage';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
  auth?: boolean;
};

const REQUEST_TIMEOUT_MS = 60_000;

let onUnauthorized: (() => void) | null = null;
let onForbidden: ((body: ApiErrorBody) => void) | null = null;

export function setApiHandlers(handlers: {
  onUnauthorized?: () => void;
  onForbidden?: (body: ApiErrorBody) => void;
}) {
  onUnauthorized = handlers.onUnauthorized ?? null;
  onForbidden = handlers.onForbidden ?? null;
}

export async function getStoredToken(): Promise<string | null> {
  return getSecureItem(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) {
    await setSecureItem(TOKEN_STORAGE_KEY, token);
  } else {
    await deleteSecureItem(TOKEN_STORAGE_KEY);
  }
}

function buildBody(body: RequestOptions['body']): BodyInit | undefined {
  if (body == null) return undefined;
  if (body instanceof FormData) return body;
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }
  return body as BodyInit;
}

function buildHeaders(body: RequestOptions['body'], token: string | null, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('Accept', 'application/json');
  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, {
        message: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
      });
    }
    throw new ApiError(0, {
      message: 'No se pudo conectar al servidor. Comprueba tu conexión a internet.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJsonBody(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: 'Respuesta inválida del servidor' };
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: extraHeaders, ...init } = options;
  const token = auth ? await getStoredToken() : null;

  if (auth && !token) {
    throw new ApiError(401, { message: 'No hay sesión activa' });
  }

  const resolvedBody = buildBody(body);
  const headers = buildHeaders(body ?? null, auth ? token : null, extraHeaders);

  const url = `${SELLER_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetchWithTimeout(url, {
    ...init,
    headers,
    body: resolvedBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const json = parseJsonBody(text);

  if (!response.ok) {
    const errorBody = (typeof json === 'object' && json !== null ? json : {}) as ApiErrorBody;
    const error = new ApiError(response.status, errorBody);
    if (response.status === 401) {
      await setStoredToken(null);
      onUnauthorized?.();
    }
    if (response.status === 403) {
      onForbidden?.(errorBody);
    }
    throw error;
  }

  return json as T;
}
