import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { IsiPlazaColors, IsiPlazaRadius, IsiPlazaSpacing } from '@/constants/isi-plaza';

type IsiInputProps = TextInputProps & {
  label?: string;
};

export function IsiInput({ label, style, editable = true, ...rest }: IsiInputProps) {
  const isLocked = editable === false;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, isLocked && styles.inputLocked, style]}
        placeholderTextColor={IsiPlazaColors.textSecondary}
        editable={editable}
        selectTextOnFocus={!isLocked}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: IsiPlazaSpacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: IsiPlazaColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: IsiPlazaColors.border,
    borderRadius: IsiPlazaRadius.sm,
    paddingHorizontal: IsiPlazaSpacing.md,
    paddingVertical: IsiPlazaSpacing.md,
    fontSize: 16,
    color: IsiPlazaColors.text,
    backgroundColor: IsiPlazaColors.white,
  },
  inputLocked: {
    backgroundColor: IsiPlazaColors.backgroundMuted,
    borderColor: IsiPlazaColors.border,
    color: IsiPlazaColors.textSecondary,
  },
});
