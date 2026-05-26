import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { IsiPlazaColors } from '@/constants/isi-plaza';
import { useAppMode } from '@/contexts/AppModeContext';

const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AccesoModoScreen() {
  const router = useRouter();
  const { setAppMode } = useAppMode();
  
  // Decorative animations
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [floatAnim]);

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const handleComprador = async () => {
    await setAppMode('comprador');
    router.replace('/(buyer)/buscar');
  };

  const handleMayorista = async () => {
    await setAppMode('mayorista');
    router.replace('/(auth)/registro');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Decorative Background Mesh */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ translateY: floatInterpolate }] }]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../Logo.jpeg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        <Text style={styles.title}>Bienvenido a ISI PLAZA</Text>
        <Text style={styles.subtitle}>Selecciona el perfil con el que deseas ingresar a la plataforma</Text>

        <View style={styles.cardsContainer}>
          <Pressable 
            style={({ pressed }) => [styles.modeCard, pressed && styles.cardPressed]}
            onPress={handleComprador}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="cart-outline" size={32} color="#4CAF50" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Busco mayorista</Text>
              <Text style={styles.cardDesc}>Explora y compra productos al por mayor.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={IsiPlazaColors.textSecondary} />
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.modeCard, pressed && styles.cardPressed]}
            onPress={handleMayorista}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${IsiPlazaColors.primary}20` }]}>
              <Ionicons name="business-outline" size={32} color={IsiPlazaColors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Soy Mayorista</Text>
              <Text style={styles.cardDesc}>Gestiona tu catálogo y perfil de ventas.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={IsiPlazaColors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Dark aesthetic
  },
  blob1: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 999,
    backgroundColor: IsiPlazaColors.primary,
    opacity: 0.15,
    filter: 'blur(50px)' as any,
  },
  blob2: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 999,
    backgroundColor: '#4CAF50',
    opacity: 0.1,
    filter: 'blur(60px)' as any,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 40,
    shadowColor: IsiPlazaColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    backgroundColor: IsiPlazaColors.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 220,
    height: 110,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 48,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
});
