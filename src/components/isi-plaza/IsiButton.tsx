import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';

type IsiButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost';
};

export function IsiButton({ label, variant = 'primary', style, disabled, ...rest }: IsiButtonProps) {
  return (
    <Pressable
      style={(state) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled}
      {...rest}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'outline' && styles.labelOutline,
          variant === 'ghost' && styles.labelGhost,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: IsiPlazaSpacing.md,
    paddingHorizontal: IsiPlazaSpacing.lg,
    borderRadius: IsiPlazaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: IsiPlazaColors.primary,
  },
  outline: {
    backgroundColor: IsiPlazaColors.white,
    borderWidth: 1.5,
    borderColor: IsiPlazaColors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelPrimary: {
    color: IsiPlazaColors.white,
  },
  labelOutline: {
    color: IsiPlazaColors.primary,
  },
  labelGhost: {
    color: IsiPlazaColors.primary,
    fontSize: 14,
  },
});
