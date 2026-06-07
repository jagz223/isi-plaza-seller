import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform } from 'react-native';

import { resolveMediaUrl } from '@/services/api/config';
import { consumerDocumentDownloadUrl } from '@/utils/consumer-document-url';

export async function downloadConsumerDocument(
  downloadUrl: string,
  type: 'pdf' | 'excel',
): Promise<void> {
  const url = consumerDocumentDownloadUrl(resolveMediaUrl(downloadUrl) ?? downloadUrl);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = type === 'pdf' ? 'catalogo.pdf' : 'catalogo.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } else {
      await Linking.openURL(url);
    }
    return;
  }

  const ext = type === 'pdf' ? 'pdf' : 'xlsx';
  const filename = `isi-plaza-catalogo-${Date.now()}.${ext}`;
  const destination = `${FileSystem.cacheDirectory}${filename}`;

  try {
    const result = await FileSystem.downloadAsync(url, destination);
    const canOpen = await Linking.canOpenURL(result.uri);
    if (canOpen) {
      await Linking.openURL(result.uri);
    } else {
      Alert.alert(
        'Descarga lista',
        `El archivo se guardó en: ${result.uri}`,
      );
    }
  } catch {
    Alert.alert(
      'No se pudo descargar',
      'Comprueba tu conexión o que el mayorista tenga el archivo subido.',
    );
  }
}
