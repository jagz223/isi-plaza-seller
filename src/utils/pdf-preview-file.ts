import * as FileSystem from 'expo-file-system/legacy';

async function copyLocalUriToCache(uri: string, dest: string): Promise<void> {
  const needsCopy =
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    !uri.startsWith('file://');

  if (needsCopy) {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return;
  }

  if (uri === dest) {
    return;
  }

  await FileSystem.copyAsync({ from: uri, to: dest });
}

/** Deja el PDF en caché como archivo local para que pdf.js lo abra en WebView (Android/iOS). */
export async function resolvePdfPreviewFile(uri: string): Promise<{ baseUrl: string; fileName: string }> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('No hay directorio de caché para la vista previa.');
  }

  const fileName = `preview-${Date.now()}.pdf`;
  const dest = `${cacheDir}${fileName}`;

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const result = await FileSystem.downloadAsync(uri, dest);
    if (result.status !== 200) {
      throw new Error('No se pudo descargar el PDF para la vista previa.');
    }
    return { baseUrl: cacheDir, fileName };
  }

  await copyLocalUriToCache(uri, dest);

  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists || ('size' in info && info.size === 0)) {
    throw new Error('El archivo PDF está vacío o no se pudo leer.');
  }

  return { baseUrl: cacheDir, fileName };
}
