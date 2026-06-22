import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

import { resolveMediaUrl } from '@/services/api/config';
import { consumerDocumentDownloadUrl } from '@/utils/consumer-document-url';

const DOWNLOAD_NAMES = {
  pdf: 'catalogo.pdf',
  excel: 'catalogo.xlsx',
} as const;

const MIME_TYPES = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

function resolveDownloadUrl(downloadUrl: string): string {
  return consumerDocumentDownloadUrl(resolveMediaUrl(downloadUrl) ?? downloadUrl);
}

async function downloadOnWeb(url: string, type: 'pdf' | 'excel'): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = DOWNLOAD_NAMES[type];
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadOnNative(url: string, type: 'pdf' | 'excel'): Promise<void> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('No hay directorio de caché para guardar el archivo.');
  }

  const destination = `${cacheDir}${DOWNLOAD_NAMES[type]}`;
  const result = await FileSystem.downloadAsync(url, destination);

  if (result.status !== 200) {
    throw new Error(`HTTP ${result.status}`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: MIME_TYPES[type],
      dialogTitle: type === 'pdf' ? 'Guardar PDF del catálogo' : 'Guardar Excel del catálogo',
      UTI: type === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet',
    });
    return;
  }

  const canOpen = await Linking.canOpenURL(result.uri);
  if (canOpen) {
    await Linking.openURL(result.uri);
    return;
  }

  await Linking.openURL(url);
}

export async function downloadConsumerDocument(
  downloadUrl: string,
  type: 'pdf' | 'excel',
): Promise<void> {
  const url = resolveDownloadUrl(downloadUrl);

  try {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        await downloadOnWeb(url, type);
      } else {
        await Linking.openURL(url);
      }
      return;
    }

    await downloadOnNative(url, type);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'No se pudo descargar',
        'Comprueba tu conexión o que el mayorista tenga el archivo subido.',
      );
    }
  }
}
