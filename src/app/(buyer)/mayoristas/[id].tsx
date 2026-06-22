import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SELLER_PROFILE_HERO_HEIGHT } from '@/constants/buyer-seller-display';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  addConsumerFavorite,
  fetchConsumerSeller,
  recordConsumerSellerInteraction,
  removeConsumerFavorite,
} from '@/services/api/consumer';
import type { ConsumerSellerDetail } from '@/types/consumer-api';
import { CatalogDocumentEmbed } from '@/components/buyer/CatalogDocumentEmbed';
import { SellerVerifiedBadge } from '@/components/buyer/SellerVerifiedBadge';
import { buildProductCarousels } from '@/utils/build-product-carousels';
import { downloadConsumerDocument } from '@/utils/download-consumer-document';
const CATALOG_THUMB = 108;

function socialUrl(base: string, value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) {
    return v;
  }
  const handle = v.replace(/^@/, '');
  return `https://${base}/${handle}`;
}

function OutlineButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.outlineBtn, disabled && styles.outlineBtnDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={[styles.outlineBtnText, disabled && styles.outlineBtnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function DownloadButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[styles.downloadBtn, (disabled || loading) && styles.downloadBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={IsiPlazaColors.white} size="small" />
      ) : (
        <Text style={styles.downloadBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export default function MayoristaDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sellerId = Number(id);

  const [loading, setLoading] = useState(true);
  const [mayorista, setMayorista] = useState<ConsumerSellerDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const load = useCallback(async () => {
    if (!sellerId || Number.isNaN(sellerId)) {
      setError('Mayorista no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsumerSeller(sellerId);
      setMayorista(data);
      setIsFavorite(data.is_favorited);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudo cargar el mayorista.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const carousels = useMemo(
    () =>
      mayorista
        ? buildProductCarousels(mayorista.carousel_metadata, mayorista.catalog_images)
        : [],
    [mayorista],
  );

  const catalogMode = useMemo(() => {
    if (!mayorista) {
      return 'none' as const;
    }
    if (mayorista.catalog_display_mode) {
      return mayorista.catalog_display_mode;
    }
    if (mayorista.pdf_url) {
      return 'pdf' as const;
    }
    if (mayorista.excel_url) {
      return 'excel' as const;
    }
    if (carousels.length > 0) {
      return 'carousel' as const;
    }
    return 'none' as const;
  }, [mayorista, carousels.length]);

  const openLink = async (url: string | null | undefined) => {
    if (!url) {
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace.');
    }
  };

  const openWhatsapp = () => {
    const wa = mayorista?.whatsapp;
    if (!wa) {
      return;
    }
    if (!Number.isNaN(sellerId)) {
      recordConsumerSellerInteraction(sellerId, 'whatsapp_click');
    }
    const phone = wa.replace(/\D/g, '');
    void openLink(
      `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent('Hola, vi tu perfil en ISI PLAZA')}`,
    );
  };

  const openWebsite = () => {
    if (!mayorista?.website) {
      return;
    }
    if (!Number.isNaN(sellerId)) {
      recordConsumerSellerInteraction(sellerId, 'website_click');
    }
    void openLink(mayorista.website);
  };

  const handleDownloadPdf = async () => {
    if (!mayorista?.pdf_url) {
      Alert.alert('Sin archivo', 'Este mayorista no tiene PDF de catálogo.');
      return;
    }
    setDownloadingPdf(true);
    try {
      await downloadConsumerDocument(mayorista.pdf_url, 'pdf');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!mayorista?.excel_url) {
      Alert.alert('Sin archivo', 'Este mayorista no tiene Excel de catálogo.');
      return;
    }
    setDownloadingExcel(true);
    try {
      await downloadConsumerDocument(mayorista.excel_url, 'excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const toggleFavorite = async () => {
    if (!sellerId || Number.isNaN(sellerId)) {
      return;
    }
    try {
      const favorited = isFavorite
        ? await removeConsumerFavorite(sellerId)
        : await addConsumerFavorite(sellerId);
      setIsFavorite(favorited);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar favoritos.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
      </View>
    );
  }

  if (error || !mayorista) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Text style={styles.errorText}>{error ?? 'No encontrado'}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const heroWidth = screenWidth;

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + IsiPlazaSpacing.sm }]}>
        <Pressable style={styles.backPressable} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={Platform.OS === 'android'}>
        <View style={[styles.heroWrap, { width: heroWidth }]}>
          {mayorista.avatar_url ? (
            <Image source={{ uri: mayorista.avatar_url }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          {mayorista.is_verified ? <SellerVerifiedBadge /> : null}
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <View style={styles.nameBox}>
              <Text style={styles.nameText}>{mayorista.name}</Text>
            </View>
          </View>

          {mayorista.description?.trim() ? (
            <Text style={styles.descText}>{mayorista.description.trim()}</Text>
          ) : null}

          <Pressable style={styles.likeRow} onPress={() => void toggleFavorite()}>
            <Text style={styles.likeQuestion}>¿Te gusta este mayorista?</Text>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={IsiPlazaColors.black}
            />
          </Pressable>

          <View style={styles.grid2}>
            <OutlineButton label="Whatsapp" onPress={openWhatsapp} disabled={!mayorista.whatsapp} />
            <OutlineButton
              label="Instagram"
              onPress={() => openLink(socialUrl('instagram.com', mayorista.instagram))}
              disabled={!mayorista.instagram}
            />
            <OutlineButton
              label="Facebook"
              onPress={() => openLink(socialUrl('facebook.com', mayorista.facebook))}
              disabled={!mayorista.facebook}
            />
            <OutlineButton label="Web" onPress={openWebsite} disabled={!mayorista.website} />
          </View>

          {catalogMode !== 'none' ? (
            <View style={styles.catalogSection}>
              <Text style={styles.catalogHeading}>Catálogo e informacion</Text>

              {catalogMode === 'pdf' ? (
                <>
                  <DownloadButton
                    label="Descargar PDF"
                    onPress={() => void handleDownloadPdf()}
                    disabled={!mayorista.pdf_url}
                    loading={downloadingPdf}
                  />
                  {mayorista.pdf_url ? (
                    <CatalogDocumentEmbed url={mayorista.pdf_url} type="pdf" />
                  ) : null}
                </>
              ) : null}

              {catalogMode === 'excel' ? (
                <>
                  <DownloadButton
                    label="Descargar EXCEL"
                    onPress={() => void handleDownloadExcel()}
                    disabled={!mayorista.excel_url}
                    loading={downloadingExcel}
                  />
                  {mayorista.excel_url ? (
                    <CatalogDocumentEmbed url={mayorista.excel_url} type="excel" />
                  ) : null}
                </>
              ) : null}

              {catalogMode === 'carousel'
                ? carousels.map((carousel) => (
                    <View key={carousel.slot} style={styles.carouselBlock}>
                      <View style={styles.carouselTitleBar}>
                        <Text style={styles.carouselTitleText} numberOfLines={2}>
                          {carousel.title}
                        </Text>
                      </View>
                      <View style={styles.carouselDescBar}>
                        <Text style={styles.carouselDescText} numberOfLines={3} ellipsizeMode="tail">
                          {carousel.description}
                        </Text>
                      </View>
                      {carousel.images.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.carouselScroll}>
                          {carousel.images.map((img) => (
                            <View key={img.id} style={styles.catalogThumb}>
                              <Image
                                source={{ uri: img.image_url }}
                                style={styles.catalogThumbImage}
                                contentFit="cover"
                              />
                            </View>
                          ))}
                        </ScrollView>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.white,
  },
  errorText: {
    textAlign: 'center',
    color: IsiPlazaColors.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    color: IsiPlazaColors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    backgroundColor: IsiPlazaColors.white,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingBottom: IsiPlazaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IsiPlazaColors.border,
  },
  backPressable: {
    alignSelf: 'flex-start',
    paddingVertical: IsiPlazaSpacing.xs,
  },
  backText: {
    color: IsiPlazaColors.primaryDark,
    fontSize: 18,
    fontWeight: '600',
  },
  heroWrap: {
    height: SELLER_PROFILE_HERO_HEIGHT,
    backgroundColor: IsiPlazaColors.backgroundMuted,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#B8C9E0',
  },
  body: {
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingTop: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IsiPlazaSpacing.sm,
  },
  nameBox: {
    flex: 1,
    backgroundColor: IsiPlazaColors.white,
    paddingVertical: IsiPlazaSpacing.xs,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: IsiPlazaColors.text,
  },
  descText: {
    fontSize: 15,
    fontWeight: '400',
    color: IsiPlazaColors.text,
    lineHeight: 22,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: IsiPlazaSpacing.xs,
  },
  likeQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.text,
    flex: 1,
    paddingRight: 8,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IsiPlazaSpacing.sm,
  },
  outlineBtn: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.black,
    borderRadius: IsiPlazaRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IsiPlazaColors.white,
  },
  outlineBtnDisabled: {
    opacity: 0.45,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: IsiPlazaColors.text,
  },
  outlineBtnTextDisabled: {
    color: IsiPlazaColors.textSecondary,
  },
  downloadBtn: {
    width: '100%',
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  downloadBtnDisabled: {
    opacity: 0.45,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: IsiPlazaColors.white,
    textAlign: 'center',
  },
  catalogSection: {
    marginTop: IsiPlazaSpacing.sm,
    gap: IsiPlazaSpacing.lg,
  },
  catalogHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: IsiPlazaColors.text,
  },
  carouselBlock: {
    gap: 0,
  },
  carouselTitleBar: {
    backgroundColor: IsiPlazaColors.white,
    paddingVertical: 10,
    paddingHorizontal: IsiPlazaSpacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  carouselTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.text,
  },
  carouselDescBar: {
    backgroundColor: IsiPlazaColors.white,
    paddingVertical: 10,
    paddingHorizontal: IsiPlazaSpacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  carouselDescText: {
    fontSize: 14,
    color: IsiPlazaColors.text,
  },
  carouselScroll: {
    paddingVertical: IsiPlazaSpacing.sm,
    gap: IsiPlazaSpacing.sm,
    paddingRight: IsiPlazaSpacing.md,
  },
  catalogThumb: {
    width: CATALOG_THUMB,
    height: CATALOG_THUMB + 16,
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.black,
    borderRadius: IsiPlazaRadius.sm,
    overflow: 'hidden',
    backgroundColor: IsiPlazaColors.white,
  },
  catalogThumbImage: {
    width: '100%',
    height: '100%',
  },
});
