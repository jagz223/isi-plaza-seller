import { Platform } from 'react-native';

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

export const API_ROOT = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST).replace(/\/$/, '');

export const SELLER_API_BASE = `${API_ROOT}/api/v1/seller`;

export const CONSUMER_API_BASE = `${API_ROOT}/api/v1/consumer`;

export const TOKEN_STORAGE_KEY = 'seller_token';

export const CONSUMER_TOKEN_STORAGE_KEY = 'consumer_token';

/**
 * Laravel suele devolver URLs con 127.0.0.1; en emulador Android hay que usar el mismo host que API_ROOT (10.0.2.2).
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const api = new URL(API_ROOT);
    const parsed = new URL(url);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      parsed.hostname = api.hostname;
      parsed.port = api.port;
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}
