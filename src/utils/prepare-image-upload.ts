import * as FileSystem from 'expo-file-system';

export type PreparedImageUpload = {
  uri: string;
  name: string;
  type: string;
};

/**
 * Copia la imagen a cache file:// para que PHP reciba el binario en $_FILES.
 * En Android, content:// suele fallar si se pasa directo a FormData/fetch.
 */
export async function prepareImageForMultipart(localUri: string): Promise<PreparedImageUpload> {
  const rawName = localUri.split('/').pop()?.split('?')[0] ?? `image-${Date.now()}.jpg`;
  const name = rawName.includes('.') ? rawName : `${rawName}.jpg`;
  const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const needsCopy =
    localUri.startsWith('content://') ||
    localUri.startsWith('ph://') ||
    localUri.startsWith('assets-library://') ||
    !localUri.startsWith('file://');

  let uploadUri = localUri;

  if (needsCopy) {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('No hay directorio de caché para preparar la imagen.');
    }
    uploadUri = `${cacheDir}upload-${Date.now()}-${name}`;
    await FileSystem.copyAsync({ from: localUri, to: uploadUri });
  }

  const info = await FileSystem.getInfoAsync(uploadUri);
  if (!info.exists) {
    throw new Error('No se pudo leer la imagen seleccionada.');
  }
  if ('size' in info && info.size !== undefined && info.size === 0) {
    throw new Error('La imagen seleccionada está vacía.');
  }

  return { uri: uploadUri, name, type };
}
