import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import { buildPdfJsPreviewHtml } from '@/utils/pdf-preview-html';
import { resolvePdfPreviewFile } from '@/utils/pdf-preview-file';
import { readUriAsArrayBuffer } from '@/utils/read-uri-as-array-buffer';
import { buildLocalSpreadsheetPreviewHtml } from '@/utils/spreadsheet-preview-html';

type Props = {
  uri: string;
  type: 'pdf' | 'excel';
  fileName?: string;
};

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function PendingPreview({
  type,
  fileName,
  hint,
}: {
  type: 'pdf' | 'excel';
  fileName?: string;
  hint: string;
}) {
  return (
    <View style={styles.pendingBox}>
      <Text style={styles.pendingTitle}>
        {type === 'pdf' ? 'Vista previa del PDF' : 'Vista previa del Excel'}
      </Text>
      {fileName ? <Text style={styles.pendingFile}>{fileName}</Text> : null}
      <Text style={styles.pendingHint}>{hint}</Text>
    </View>
  );
}

function LoadingPreview({ label = 'Cargando vista previa…' }: { label?: string }) {
  return (
    <View style={[styles.wrap, styles.loadingBox]}>
      <ActivityIndicator color={IsiPlazaColors.primary} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

const webViewProps = Platform.OS === 'web'
  ? {}
  : {
      originWhitelist: ['*'] as const,
      allowFileAccess: true,
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      mixedContentMode: 'always' as const,
      javaScriptEnabled: true,
      domStorageEnabled: true,
      setSupportMultipleWindows: false,
    };

function PdfPreview({ uri, fileName }: { uri: string; fileName?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [webBlobUrl, setWebBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewFailed, setWebViewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setWebViewFailed(false);
    setHtml(null);
    setBaseUrl(null);
    setWebBlobUrl(null);

    const load = async () => {
      try {
        if (Platform.OS === 'web') {
          const buffer = await readUriAsArrayBuffer(uri);
          if (cancelled) {
            return;
          }
          const blob = new Blob([buffer], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(blob);
          setWebBlobUrl(objectUrl);
          return;
        }

        const { baseUrl: cacheBase, fileName: cacheFile } = await resolvePdfPreviewFile(uri);
        if (cancelled) {
          return;
        }
        setBaseUrl(cacheBase);
        setHtml(buildPdfJsPreviewHtml(cacheFile));
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo leer el PDF.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uri]);

  if (loading) {
    return <LoadingPreview label="Cargando vista previa del PDF…" />;
  }

  if (error || webViewFailed) {
    return (
      <PendingPreview
        type="pdf"
        fileName={fileName}
        hint={
          error ??
          'No se pudo mostrar la vista previa. Puedes guardar el archivo y volver a abrirlo después.'
        }
      />
    );
  }

  if (Platform.OS === 'web' && webBlobUrl) {
    return (
      <View style={styles.wrap}>
        <iframe src={webBlobUrl} style={styles.frame} title="Vista previa PDF" />
      </View>
    );
  }

  if (!html || !baseUrl) {
    return (
      <PendingPreview
        type="pdf"
        fileName={fileName}
        hint="No se pudo mostrar la vista previa. Puedes guardar el archivo y volver a abrirlo después."
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ html, baseUrl }}
        style={styles.webview}
        startInLoadingState
        onError={() => setWebViewFailed(true)}
        onHttpError={() => setWebViewFailed(true)}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={IsiPlazaColors.primary} />
          </View>
        )}
        {...webViewProps}
      />
    </View>
  );
}

function ExcelPreview({ uri, fileName }: { uri: string; fileName?: string }) {
  const [localHtml, setLocalHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewFailed, setWebViewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWebViewFailed(false);
    setLocalHtml(null);

    void buildLocalSpreadsheetPreviewHtml(uri)
      .then((html) => {
        if (!cancelled) {
          setLocalHtml(html);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo leer el Excel.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (loading) {
    return <LoadingPreview label="Cargando vista previa del Excel…" />;
  }

  if (error || webViewFailed || !localHtml) {
    return (
      <PendingPreview
        type="excel"
        fileName={fileName}
        hint={
          error ??
          'No se pudo mostrar la vista previa. Puedes guardar el archivo y volver a abrirlo después.'
        }
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <iframe srcDoc={localHtml} style={styles.frame} title="Vista previa Excel" sandbox="allow-same-origin" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ html: localHtml }}
        style={styles.webview}
        startInLoadingState
        onError={() => setWebViewFailed(true)}
        onHttpError={() => setWebViewFailed(true)}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={IsiPlazaColors.primary} />
          </View>
        )}
        {...webViewProps}
      />
    </View>
  );
}

function RemoteExcelPreview({ uri, fileName }: { uri: string; fileName?: string }) {
  const [useOfficeEmbed, setUseOfficeEmbed] = useState(Platform.OS === 'web');

  if (!useOfficeEmbed) {
    return <ExcelPreview uri={uri} fileName={fileName} />;
  }

  const embedSource = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(uri)}`;

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ uri: embedSource }}
        style={styles.webview}
        startInLoadingState
        onError={() => setUseOfficeEmbed(false)}
        onHttpError={() => setUseOfficeEmbed(false)}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={IsiPlazaColors.primary} />
          </View>
        )}
        {...webViewProps}
      />
    </View>
  );
}

export function SellerDocumentPreview({ uri, type, fileName }: Props) {
  if (!uri) {
    return null;
  }

  if (type === 'pdf') {
    return <PdfPreview uri={uri} fileName={fileName} />;
  }

  if (isRemoteUri(uri)) {
    return <RemoteExcelPreview uri={uri} fileName={fileName} />;
  }

  return <ExcelPreview uri={uri} fileName={fileName} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 360,
    borderRadius: IsiPlazaRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    marginTop: IsiPlazaSpacing.sm,
  },
  frame: {
    width: '100%',
    height: 420,
    borderWidth: 0,
  } as object,
  webview: {
    flex: 1,
    minHeight: 360,
    backgroundColor: IsiPlazaColors.white,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.white,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: IsiPlazaSpacing.sm,
    paddingVertical: IsiPlazaSpacing.lg,
  },
  loadingText: {
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
  },
  pendingBox: {
    marginTop: IsiPlazaSpacing.sm,
    padding: IsiPlazaSpacing.md,
    borderRadius: IsiPlazaRadius.md,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    gap: 6,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: IsiPlazaColors.text,
  },
  pendingFile: {
    fontSize: 13,
    color: IsiPlazaColors.textSecondary,
  },
  pendingHint: {
    fontSize: 12,
    color: IsiPlazaColors.textSecondary,
    lineHeight: 18,
  },
});
