import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function resolveReadableFileUri(localUri: string): Promise<string> {
  const needsCopy =
    localUri.startsWith('content://') ||
    localUri.startsWith('ph://') ||
    localUri.startsWith('assets-library://');

  if (!needsCopy) {
    return localUri;
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('No hay directorio de caché para leer el archivo.');
  }

  const rawName = localUri.split('/').pop()?.split('?')[0] ?? `doc-${Date.now()}`;
  const readUri = `${cacheDir}preview-${Date.now()}-${rawName}`;
  await FileSystem.copyAsync({ from: localUri, to: readUri });

  return readUri;
}

/** Lee un URI local (o blob en web) como ArrayBuffer para parsear documentos. */
export async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (
    Platform.OS === 'web' ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  ) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('No se pudo leer el archivo seleccionado.');
    }
    return response.arrayBuffer();
  }

  const readUri = await resolveReadableFileUri(uri);
  const base64 = await FileSystem.readAsStringAsync(readUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64?.length) {
    throw new Error('El archivo está vacío.');
  }

  return base64ToArrayBuffer(base64);
}
