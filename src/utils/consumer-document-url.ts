/** URL del proxy API para ver el documento en pantalla (inline). */
export function consumerDocumentPreviewUrl(url: string): string {
  return stripDownloadParam(url);
}

/** URL del proxy API para forzar descarga al pulsar el botón. */
export function consumerDocumentDownloadUrl(url: string): string {
  const base = stripDownloadParam(url);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}download=1`;
}

function stripDownloadParam(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('download');
    return parsed.toString();
  } catch {
    return url.replace(/([?&])download=1&?/, '$1').replace(/[?&]$/, '');
  }
}
