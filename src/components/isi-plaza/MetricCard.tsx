import { StyleSheet, Text, View } from 'react-native';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';

type MetricCardProps = {
  label: string;
  value: number;
};

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.md,
    padding: IsiPlazaSpacing.lg,
    gap: IsiPlazaSpacing.sm,
  },
  label: {
    fontSize: 15,
    color: IsiPlazaColors.text,
    lineHeight: 22,
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
    color: IsiPlazaColors.primary,
  },
});
