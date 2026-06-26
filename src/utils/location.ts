import * as Location from 'expo-location';
import { Alert } from 'react-native';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Ubicación necesaria',
      'Activa el permiso de ubicación para encontrar dentistas cerca de ti.',
    );
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `A ${Math.round(distanceKm * 1000)} m`;
  }

  return `A ${distanceKm.toFixed(1)} km`;
}
