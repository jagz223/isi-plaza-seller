import { resolveMediaUrl } from '@/services/api/config';

export function isAuthenticatedCatalogImageUrl(url: string): boolean {
  return url.includes('/catalog-images/') && url.includes('/file');
}

export function catalogImageSource(
  url: string,
  authHeaders: Record<string, string>,
): { uri: string; headers?: Record<string, string> } {
  const uri = resolveMediaUrl(url) ?? url;

  if (isAuthenticatedCatalogImageUrl(uri) && Object.keys(authHeaders).length > 0) {
    return { uri, headers: authHeaders };
  }

  return { uri };
}
