import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SellerVerifiedBadge } from '@/components/buyer/SellerVerifiedBadge';
import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';
import {
  addConsumerFavorite,
  fetchConsumerSeller,
  recordConsumerSellerInteraction,
  removeConsumerFavorite,
} from '@/services/api/consumer';
import type { ConsumerSellerDetail } from '@/types/consumer-api';
import { formatSellerLocationBlock } from '@/utils/format-seller-location';

const PANEL_BG = '#C5E4EF';
const SERVICE_PILL_BG = '#B8DCE8';
const PHOTO_HEIGHT = 200;

function PrimaryActionButton({
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
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={[styles.actionBtnText, disabled && styles.actionBtnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

export default function MedicoDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sellerId = Number(id);

  const [loading, setLoading] = useState(true);
  const [medico, setMedico] = useState<ConsumerSellerDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId || Number.isNaN(sellerId)) {
      setError('Médico no válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsumerSeller(sellerId);
      setMedico(data);
      setIsFavorite(data.is_favorited);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'No se pudo cargar el médico.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    const wa = medico?.whatsapp;
    if (!wa) {
      return;
    }
    if (!Number.isNaN(sellerId)) {
      recordConsumerSellerInteraction(sellerId, 'whatsapp_click');
    }
    const phone = wa.replace(/\D/g, '');
    void openLink(
      `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent('Hola, vi tu perfil en ODONTICA')}`,
    );
  };

  const openPhone = () => {
    const phone = medico?.phone?.replace(/\D/g, '');
    if (!phone) {
      return;
    }
    void openLink(`tel:${phone}`);
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

  const photoUrls = useMemo(() => {
    if (!medico) {
      return [];
    }
    const gallery = (medico.catalog_images ?? [])
      .filter((img) => img.display_order === 1)
      .map((img) => img.image_url)
      .filter(Boolean);
    if (gallery.length > 0) {
      return gallery;
    }
    if (medico.avatar_url) {
      return [medico.avatar_url];
    }
    return [];
  }, [medico]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
      </View>
    );
  }

  if (error || !medico) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Text style={styles.errorText}>{error ?? 'No encontrado'}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const services = medico.services ?? [];
  const locationBlock = formatSellerLocationBlock(medico);
  const primaryPhoto = photoUrls[0];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + IsiPlazaSpacing.sm, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <Pressable style={styles.backPill} onPress={() => router.back()}>
            <Text style={styles.backPillText}>Volver</Text>
          </Pressable>

          <View style={styles.photoArea}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.photoImage} contentFit="cover" />
            ) : (
              <Text style={styles.photoPlaceholderText}>Sin fotos</Text>
            )}
            {medico.is_verified ? (
              <View style={styles.verifiedWrap}>
                <SellerVerifiedBadge />
              </View>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.nameText}>{medico.name}</Text>
            {medico.professional_license ? (
              <Text style={styles.licenseText}>
                Cédula profesional: {medico.professional_license}
              </Text>
            ) : null}
          </View>

          {locationBlock ? (
            <View style={styles.infoCard}>
              <Text style={styles.locationLabel}>UBICACIÓN:</Text>
              <Text style={styles.locationBody}>{locationBlock}</Text>
            </View>
          ) : null}

          {services.length > 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.servicesTitle}>Servicios</Text>
              <View style={styles.servicesList}>
                {services.map((service) => (
                  <View key={service.id} style={styles.servicePill}>
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {service.name ?? 'Tratamiento'}
                    </Text>
                    <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <PrimaryActionButton label="Llamar" onPress={openPhone} disabled={!medico.phone} />
            <PrimaryActionButton
              label="WhatsApp"
              onPress={openWhatsapp}
              disabled={!medico.whatsapp}
            />
          </View>

          <Pressable
            style={styles.favoriteRow}
            onPress={() => void toggleFavorite()}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Quitar de guardados' : 'Guardar médico'}>
            <Text style={styles.favoriteHint}>
              {isFavorite ? 'Guardado en tus favoritos' : 'Guardar en favoritos'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: IsiPlazaColors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IsiPlazaColors.background,
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
  scrollContent: {
    paddingHorizontal: IsiPlazaSpacing.md,
  },
  panel: {
    backgroundColor: PANEL_BG,
    borderRadius: IsiPlazaRadius.lg,
    padding: IsiPlazaSpacing.md,
    gap: IsiPlazaSpacing.md,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(18, 22, 96, 0.12)',
  },
  backPillText: {
    color: IsiPlazaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  photoArea: {
    height: PHOTO_HEIGHT,
    borderRadius: IsiPlazaRadius.md,
    backgroundColor: IsiPlazaColors.primary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    color: '#7B9FD4',
    fontSize: 22,
    fontWeight: '700',
  },
  verifiedWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  infoCard: {
    backgroundColor: IsiPlazaColors.white,
    borderRadius: IsiPlazaRadius.md,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: 14,
    gap: 6,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
  },
  licenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
    letterSpacing: 0.3,
  },
  locationBody: {
    fontSize: 12,
    fontWeight: '600',
    color: IsiPlazaColors.primary,
    lineHeight: 18,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
    marginBottom: 4,
  },
  servicesList: {
    gap: 8,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: SERVICE_PILL_BG,
    borderRadius: IsiPlazaRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  serviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: IsiPlazaColors.primary,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionBtnDisabled: {
    backgroundColor: '#9AA3C7',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: IsiPlazaColors.white,
  },
  actionBtnTextDisabled: {
    color: IsiPlazaColors.white,
    opacity: 0.85,
  },
  favoriteRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  favoriteHint: {
    fontSize: 13,
    fontWeight: '600',
    color: IsiPlazaColors.primaryMuted,
    textDecorationLine: 'underline',
  },
});
