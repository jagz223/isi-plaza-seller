import { Alert, Platform } from 'react-native';

export function showUserMessage(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}
