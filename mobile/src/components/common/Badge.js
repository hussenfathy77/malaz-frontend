import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  PENDING: { label: 'Pending', bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  COMPLETED: { label: 'Completed', bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
  CANCELLED: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  ACTIVE: { label: 'Active', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  SUSPENDED: { label: 'Suspended', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  REVOKED: { label: 'Revoked', bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1' },
  VERIFIED: { label: 'Verified Specialist', bg: '#E6FFFA', text: '#0D9488', border: '#99F6E4' },
  UNVERIFIED: { label: 'Under Review', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  PATIENT: { label: 'Patient', bg: '#E6FFFA', text: '#0D9488', border: '#99F6E4' },
  DOCTOR: { label: 'Specialist', bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
  CAREGIVER: { label: 'Caregiver', bg: '#FDF4FF', text: '#A21CAF', border: '#F5D0FE' },
  ADMIN: { label: 'Admin', bg: '#FEF2F2', text: '#BE123C', border: '#FECDD3' },
};

export const Badge = ({ status, customLabel, style, textStyle }) => {
  const normalizedKey = status ? String(status).toUpperCase() : 'PENDING';
  const config = STATUS_CONFIG[normalizedKey] || {
    label: customLabel || status,
    bg: colors.surfaceElevated,
    text: colors.textSecondary,
    border: colors.border,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }, style]}>
      <Text style={[styles.text, { color: config.text }, textStyle]}>
        {customLabel || config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
