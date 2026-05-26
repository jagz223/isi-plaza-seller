import * as FileSystem from 'expo-file-system/legacy';

export type ImageBase64Payload = {
  base64: string;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/jpg';
};

function mimeFromFilename(name: string): ImageBase64Payload['mime_type'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Copia URIs content:// a cache file:// y lee Base64 (instrucciones backend §5–7).
 */
async function resolveReadableUri(localUri: string): Promise<{ uri: string; mime_type: ImageBase64Payload['mime_type'] }> {
  const rawName = localUri.split('/').pop()?.split('?')[0] ?? `image-${Date.now()}.jpg`;
  const name = rawName.includes('.') ? rawName : `${rawName}.jpg`;
  const mime_type = mimeFromFilename(name);

  const needsCopy =
    localUri.startsWith('content://') ||
    localUri.startsWith('ph://') ||
    localUri.startsWith('assets-library://') ||
    !localUri.startsWith('file://');

  let readUri = localUri;

  if (needsCopy) {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('No hay directorio de caché para leer la imagen.');
    }
    readUri = `${cacheDir}upload-${Date.now()}-${name}`;
    await FileSystem.copyAsync({ from: localUri, to: readUri });
  }

  const info = await FileSystem.getInfoAsync(readUri);
  if (!info.exists) {
    throw new Error('No se pudo leer la imagen seleccionada.');
  }
  if ('size' in info && info.size !== undefined && info.size === 0) {
    throw new Error('La imagen seleccionada está vacía.');
  }

  return { uri: readUri, mime_type };
}

export async function imageUriToBase64Payload(localUri: string): Promise<ImageBase64Payload> {
  const { uri, mime_type } = await resolveReadableUri(localUri);
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!base64?.length) {
    throw new Error('No se pudo convertir la imagen a Base64.');
  }
  return { base64, mime_type };
}
