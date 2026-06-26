import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { SellerVerifiedBadge } from '@/components/buyer/SellerVerifiedBadge';
import {
  addConsumerFavorite,
  fetchConsumerSeller,
  recordConsumerSellerInteraction,
  removeConsumerFavorite,
} from '@/services/api/consumer';
import type { ConsumerSellerDetail } from '@/types/consumer-api';

const GALLERY_THUMB = 108;

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

export default function MedicoDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
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
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace.');
    }
  };

  const openWhatsapp = () => {
    const wa = medico?.whatsapp;
    if (!wa) return;
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
    if (!phone) return;
    void openLink(`tel:${phone}`);
  };

  const toggleFavorite = async () => {
    if (!sellerId || Number.isNaN(sellerId)) return;
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

  if (error || !medico) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Text style={styles.errorText}>{error ?? 'No encontrado'}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const galleryImages = (medico.catalog_images ?? []).filter((img) => img.display_order === 1);
  const services = medico.services ?? [];
  const locationLine = [medico.municipality, medico.address].filter(Boolean).join(' · ');

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
        showsVerticalScrollIndicator={false}>
        <View style={[styles.heroWrap, { width: screenWidth }]}>
          {medico.avatar_url ? (
            <Image source={{ uri: medico.avatar_url }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          {medico.is_verified ? <SellerVerifiedBadge /> : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.nameText}>{medico.name}</Text>

          {medico.professional_license ? (
            <Text style={styles.licenseText}>Cédula profesional: {medico.professional_license}</Text>
          ) : null}

          {locationLine ? <Text style={styles.locationText}>{locationLine}</Text> : null}

          {medico.description?.trim() ? (
            <Text style={styles.descText}>{medico.description.trim()}</Text>
          ) : null}

          <Pressable style={styles.likeRow} onPress={() => void toggleFavorite()}>
            <Text style={styles.likeQuestion}>¿Te gusta este médico?</Text>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={IsiPlazaColors.black}
            />
          </Pressable>

          <View style={styles.grid2}>
            <OutlineButton label="WhatsApp" onPress={openWhatsapp} disabled={!medico.whatsapp} />
            <OutlineButton label="Llamar" onPress={openPhone} disabled={!medico.phone} />
          </View>

          {services.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Servicios y precios</Text>
              {services.map((service) => (
                <View key={service.id} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    {service.section_name ? (
                      <Text style={styles.serviceSection}>{service.section_name}</Text>
                    ) : null}
                    <Text style={styles.serviceName}>{service.name ?? 'Tratamiento'}</Text>
                  </View>
                  <Text style={styles.servicePrice}>
                    ${service.price.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {galleryImages.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería del consultorio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                {galleryImages.map((img) => (
                  <View key={img.id} style={styles.galleryThumb}>
                    <Image source={{ uri: img.image_url }} style={styles.galleryImage} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IsiPlazaColors.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: IsiPlazaColors.white },
  errorText: { textAlign: 'center', color: IsiPlazaColors.textSecondary, marginBottom: 16 },
  backLink: { color: IsiPlazaColors.primary, fontWeight: '700', fontSize: 16 },
  scroll: { flex: 1 },
  topBar: {
    backgroundColor: IsiPlazaColors.white,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingBottom: IsiPlazaSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IsiPlazaColors.border,
  },
  backPressable: { alignSelf: 'flex-start', paddingVertical: IsiPlazaSpacing.xs },
  backText: { color: IsiPlazaColors.primaryDark, fontSize: 18, fontWeight: '600' },
  heroWrap: { position: 'relative', height: SELLER_PROFILE_HERO_HEIGHT, backgroundColor: '#D9D9D9' },
  heroImage: { width: '100%', height: SELLER_PROFILE_HERO_HEIGHT },
  heroPlaceholder: { backgroundColor: '#D9D9D9' },
  body: { paddingHorizontal: IsiPlazaSpacing.md, paddingTop: IsiPlazaSpacing.md, gap: IsiPlazaSpacing.sm },
  nameText: { fontSize: 22, fontWeight: '800', color: IsiPlazaColors.text },
  licenseText: { fontSize: 14, fontWeight: '600', color: IsiPlazaColors.primary },
  locationText: { fontSize: 13, color: IsiPlazaColors.textSecondary },
  descText: { fontSize: 14, color: IsiPlazaColors.text, lineHeight: 20 },
  likeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  likeQuestion: { fontSize: 15, fontWeight: '600', color: IsiPlazaColors.text },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  outlineBtn: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 2,
    borderColor: IsiPlazaColors.primary,
    borderRadius: IsiPlazaRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnDisabled: { borderColor: IsiPlazaColors.border, opacity: 0.5 },
  outlineBtnText: { fontSize: 14, fontWeight: '700', color: IsiPlazaColors.primary },
  outlineBtnTextDisabled: { color: IsiPlazaColors.textSecondary },
  section: { marginTop: IsiPlazaSpacing.lg, gap: IsiPlazaSpacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: IsiPlazaColors.primary, textTransform: 'uppercase' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    padding: IsiPlazaSpacing.md,
    backgroundColor: IsiPlazaColors.backgroundMuted,
  },
  serviceInfo: { flex: 1, paddingRight: 8 },
  serviceSection: { fontSize: 11, fontWeight: '700', color: IsiPlazaColors.textSecondary, textTransform: 'uppercase' },
  serviceName: { fontSize: 15, fontWeight: '700', color: IsiPlazaColors.text },
  servicePrice: { fontSize: 16, fontWeight: '800', color: IsiPlazaColors.primary },
  galleryScroll: { gap: 10 },
  galleryThumb: { width: GALLERY_THUMB, height: GALLERY_THUMB, borderRadius: IsiPlazaRadius.sm, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
});
