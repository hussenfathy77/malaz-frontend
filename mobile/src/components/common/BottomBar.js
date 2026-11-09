import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export const BottomBar = ({ currentScreen, onNavigate }) => {
  const { role } = useAuth();

  let tabs = [];

  if (role === 'PATIENT') {
    tabs = [
      { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'doctors', label: 'Specialists', icon: 'people-outline', activeIcon: 'people' },
      { key: 'journals', label: 'Journals', icon: 'book-outline', activeIcon: 'book' },
      { key: 'circles', label: 'Circles', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ];
  } else if (role === 'DOCTOR') {
    tabs = [
      { key: 'home', label: 'Overview', icon: 'speedometer-outline', activeIcon: 'speedometer' },
      { key: 'doctor-appointments', label: 'Appointments', icon: 'calendar-outline', activeIcon: 'calendar' },
      { key: 'doctor-patients', label: 'Patients', icon: 'people-outline', activeIcon: 'people' },
      { key: 'working-hours', label: 'Schedule', icon: 'time-outline', activeIcon: 'time' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ];
  } else if (role === 'CAREGIVER') {
    tabs = [
      { key: 'home', label: 'Care Hub', icon: 'heart-outline', activeIcon: 'heart' },
      { key: 'circles', label: 'Circles', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ];
  } else if (role === 'ADMIN') {
    tabs = [
      { key: 'home', label: 'Admin Hub', icon: 'shield-outline', activeIcon: 'shield' },
      { key: 'circles', label: 'Circles', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
      { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ];
  }

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
