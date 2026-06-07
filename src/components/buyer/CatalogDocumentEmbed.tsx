import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { consumerDocumentPreviewUrl } from '@/utils/consumer-document-url';

type Props = {
  url: string;
  type: 'pdf' | 'excel';
};

export function CatalogDocumentEmbed({ url, type }: Props) {
  const previewUrl = consumerDocumentPreviewUrl(url);

  const embedSrc =
    type === 'excel'
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`
      : previewUrl;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <iframe
          src={embedSrc}
          style={styles.frame}
          title={type === 'pdf' ? 'Catálogo PDF' : 'Lista Excel'}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ uri: embedSrc }}
        style={styles.webview}
        originWhitelist={['*']}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={IsiPlazaColors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 420,
    borderRadius: IsiPlazaRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  frame: {
    width: '100%',
    height: 480,
    borderWidth: 0,
  } as object,
  webview: {
    flex: 1,
    minHeight: 420,
    backgroundColor: IsiPlazaColors.white,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.white,
  },
});
