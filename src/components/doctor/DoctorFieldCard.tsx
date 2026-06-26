import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';

type DoctorFieldCardProps = ViewProps & {
  label: string;
  children: React.ReactNode;
};

export function DoctorFieldCard({ label, children, style, ...rest }: DoctorFieldCardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DoctorUIColors.white,
    borderRadius: DoctorUIRadius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: DoctorUIColors.primary,
    textTransform: 'none',
  },
});
