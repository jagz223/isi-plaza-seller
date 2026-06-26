import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';

type DoctorSaveButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function DoctorSaveButton({ label, onPress, disabled, loading }: DoctorSaveButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={DoctorUIColors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: DoctorUIColors.accent,
    borderRadius: DoctorUIRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPressed: {
    backgroundColor: DoctorUIColors.accentDark,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: DoctorUIColors.white,
    letterSpacing: 0.5,
  },
});
