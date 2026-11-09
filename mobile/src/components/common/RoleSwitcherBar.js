import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export const RoleSwitcherBar = () => {
  const { role, switchRole } = useAuth();

  const roles = [
    { key: 'PATIENT', label: 'المريض', icon: '🧑' },
    { key: 'DOCTOR', label: 'الطبيب', icon: '🩺' },
    { key: 'CAREGIVER', label: 'المرافق', icon: '🤝' },
    { key: 'ADMIN', label: 'الإدارة', icon: '🛡️' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>تبديل الدور للتجربة السريعة:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {roles.map((r) => {
          const isActive = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => switchRole(r.key)}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{r.icon}</Text>
              <Text style={[styles.text, isActive && styles.textActive]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070C1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: 4,
    fontWeight: '600',
  },
  scroll: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  icon: {
    fontSize: 14,
    marginLeft: 6,
  },
  text: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
