import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type PreparedMultipartFile = {
  uri: string;
  name: string;
  type: string;
  /** En web, FormData requiere Blob/File en lugar de { uri, name, type }. */
  webBlob?: Blob;
};

export function appendPreparedFileToFormData(
  formData: FormData,
  fieldName: string,
  prepared: PreparedMultipartFile,
): void {
  if (Platform.OS === 'web' && prepared.webBlob) {
    formData.append(fieldName, prepared.webBlob, prepared.name);
    return;
  }

  formData.append(fieldName, {
    uri: prepared.uri,
    name: prepared.name,
    type: prepared.type,
  } as unknown as Blob);
}

/**
 * Prepara un archivo local para multipart (imágenes, PDF, Excel).
 * En web convierte la URI a Blob; en móvil copia content:// a file:// si hace falta.
 */
export async function prepareFileForMultipart(
  localUri: string,
  name: string,
  mimeType: string,
): Promise<PreparedMultipartFile> {
  const safeName = name.trim() || `file-${Date.now()}`;

  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    if (!response.ok) {
      throw new Error('No se pudo leer el archivo seleccionado.');
    }
    const webBlob = await response.blob();
    if (webBlob.size === 0) {
      throw new Error('El archivo seleccionado está vacío.');
    }
    return {
      uri: localUri,
      name: safeName,
      type: webBlob.type || mimeType,
      webBlob,
    };
  }

  const needsCopy =
    localUri.startsWith('content://') ||
    localUri.startsWith('ph://') ||
    localUri.startsWith('assets-library://') ||
    !localUri.startsWith('file://');

  let uploadUri = localUri;

  if (needsCopy) {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('No hay directorio de caché para preparar el archivo.');
    }
    uploadUri = `${cacheDir}upload-${Date.now()}-${safeName}`;
    await FileSystem.copyAsync({ from: localUri, to: uploadUri });
  }

  const info = await FileSystem.getInfoAsync(uploadUri);
  if (!info.exists) {
    throw new Error('No se pudo leer el archivo seleccionado.');
  }
  if ('size' in info && info.size !== undefined && info.size === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  return { uri: uploadUri, name: safeName, type: mimeType };
}
