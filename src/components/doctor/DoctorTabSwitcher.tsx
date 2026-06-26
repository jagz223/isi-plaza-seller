import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DoctorUIColors, DoctorUIRadius } from '@/constants/doctor-ui';

export type DoctorTab = 'perfil' | 'servicios';

type DoctorTabSwitcherProps = {
  active: DoctorTab;
  onChange: (tab: DoctorTab) => void;
};

export function DoctorTabSwitcher({ active, onChange }: DoctorTabSwitcherProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.tab, active === 'perfil' && styles.tabActive]}
        onPress={() => onChange('perfil')}>
        <Text style={[styles.tabText, active === 'perfil' && styles.tabTextActive]}>Perfil</Text>
      </Pressable>
      <Pressable
        style={[styles.tab, active === 'servicios' && styles.tabActive]}
        onPress={() => onChange('servicios')}>
        <Text style={[styles.tabText, active === 'servicios' && styles.tabTextActive]}>Servicios</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: DoctorUIColors.white,
    borderRadius: DoctorUIRadius.pill,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: DoctorUIRadius.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: DoctorUIColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: DoctorUIColors.primary,
  },
  tabTextActive: {
    color: DoctorUIColors.white,
  },
});
