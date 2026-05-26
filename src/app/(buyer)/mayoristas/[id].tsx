import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { IsiHeader, IsiScreen, IsiButton } from '@/components/isi-plaza';
import { IsiPlazaColors } from '@/constants/isi-plaza';

export default function MayoristaDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false); // Simulamos carga inicial
  const [mayorista, setMayorista] = useState<any>(null);

  // MOCK data to simulate API response since the endpoint might not be ready
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMayorista({
        id: id,
        name: `Mayorista ${id}`,
        description: 'Venta de artículos de electrónica.',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        excel_url: 'https://file-examples.com/wp-content/storage/2017/02/file_example_XLSX_10.xlsx',
        whatsapp: '+54 1122334455',
        instagram: 'mayorista_ejemplo',
        facebook: 'mayorista_ejemplo',
        website: 'https://mayorista-ejemplo.com',
        catalogs: [
          { title: 'Ofertas verano', description: 'Todo al 50%', image: 'https://via.placeholder.com/400' },
          { title: 'Liquidación', description: 'Últimas unidades', image: 'https://via.placeholder.com/400' }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const openLink = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url); // sometimes canOpenURL fails but openURL works
      }
    } catch (e) {
      console.log('Error opening URL', e);
    }
  };

  const openWhatsapp = () => {
    if (!mayorista?.whatsapp) return;
    const phone = mayorista.whatsapp.replace(/\D/g, ''); // remove non-digits
    openLink(`https://api.whatsapp.com/send?phone=${phone}&text=Hola,%20estoy%20interesado%20en%20sus%20productos%20(Visto%20en%20ISI%20PLAZA)`);
  };

  if (loading || !mayorista) {
    return (
      <IsiScreen scrollable={false}>
        <IsiHeader title="Cargando..." showBack={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={IsiPlazaColors.primary} />
        </View>
      </IsiScreen>
    );
  }

  return (
    <IsiScreen scrollable={true}>
      <IsiHeader title={mayorista.name} showBack={true} />
      
      <View style={styles.container}>
        <Text style={styles.descriptionText}>{mayorista.description}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonsRow}>
          <IsiButton label="Ver PDF" onPress={() => openLink(mayorista.pdf_url)} style={styles.button} />
          <IsiButton label="Descargar Excel" onPress={() => openLink(mayorista.excel_url)} style={styles.button} variant="secondary" />
        </View>

        <View style={styles.buttonsRow}>
          <IsiButton label="WhatsApp" onPress={openWhatsapp} style={styles.button} />
          <IsiButton label="Instagram" onPress={() => openLink(`https://instagram.com/${mayorista.instagram}`)} style={styles.button} variant="secondary" />
          <IsiButton label="Facebook" onPress={() => openLink(`https://facebook.com/${mayorista.facebook}`)} style={styles.button} variant="secondary" />
        </View>
        
        {mayorista.website ? (
          <IsiButton label="Visitar Sitio Web" onPress={() => openLink(mayorista.website)} variant="ghost" />
        ) : null}

        {/* Carousels with descriptions */}
        {mayorista.catalogs.map((catalog: any, i: number) => (
          <View key={i} style={styles.carouselSection}>
            <View style={styles.carouselMock}>
              <Image source={{ uri: catalog.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} contentFit="cover" />
            </View>
            <Text style={styles.carouselTitle}>{catalog.title}</Text>
            <Text style={styles.carouselDescription}>{catalog.description}</Text>
          </View>
        ))}
      </View>
    </IsiScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    flex: 1,
    minWidth: '30%',
  },
  descriptionText: {
    fontSize: 15,
    color: IsiPlazaColors.textSecondary,
    marginBottom: 8,
  },
  carouselSection: {
    backgroundColor: IsiPlazaColors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
  },
  carouselMock: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: IsiPlazaColors.text,
    marginBottom: 4,
  },
  carouselDescription: {
    fontSize: 14,
    color: IsiPlazaColors.textSecondary,
  },
});
