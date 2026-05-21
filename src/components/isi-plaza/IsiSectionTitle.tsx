import { StyleSheet, Text } from 'react-native';

import { IsiPlazaColors, IsiPlazaSpacing } from '@/constants/isi-plaza';

type IsiSectionTitleProps = {
  children: string;
  align?: 'left' | 'center' | 'right';
};

export function IsiSectionTitle({ children, align = 'left' }: IsiSectionTitleProps) {
  return (
    <Text style={[styles.title, align === 'center' && styles.center, align === 'right' && styles.right]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: IsiPlazaColors.primary,
    marginBottom: IsiPlazaSpacing.md,
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
});
