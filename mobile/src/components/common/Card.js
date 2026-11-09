import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const Card = ({ children, style, variant = 'default' }) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.cardElevated,
        variant === 'bordered' && styles.cardBordered,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardElevated: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  cardBordered: {
    borderColor: colors.primary,
  },
});
