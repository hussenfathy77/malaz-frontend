import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

export const DoctorHomeScreen = ({ onNavigate }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    appointmentService.getMyAppointments()
      .then((data) => setAppointments(data || []))
      .catch((e) => console.error(e));
  }, []);

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Doctor Header Banner */}
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <Text style={styles.welcomeText}>Dr. {user?.full_name || 'Specialist'}</Text>
          <Badge status={user?.doctor_profile?.is_verified ? 'VERIFIED' : 'UNVERIFIED'} />
        </View>
        <Text style={styles.specializationText}>
          {user?.doctor_profile?.specialization || 'Clinical Mental Health & Psychotherapy'}
        </Text>
      </View>

      {/* Verification Notice Banner if not yet approved */}
      {!user?.doctor_profile?.is_verified && (
        <Card style={styles.unverifiedBanner}>
          <View style={styles.unverifiedRow}>
            <Ionicons name="time" size={24} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.unverifiedTitle}>حسابك قيد المراجعة والاعتماد</Text>
              <Text style={styles.unverifiedDesc}>
                تم استلام بياناتك وشهادتك بنجاح. لن يظهر ملفك للمرضى للحجز أو على الخريطة حتى يتم مراجعة الشهادة واعتماد حسابك من قبل إدارة ملاذ.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* KPI Stats Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statVal}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: colors.accent }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>
              {user?.doctor_profile?.avg_rating != null
                ? Number(user.doctor_profile.avg_rating).toFixed(1) + ' ★'
                : '— ★'}
            </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </Card>
      </View>

      {/* Quick Schedule Alert */}
      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={styles.alertIconCircle}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.alertTexts}>
            <Text style={styles.alertTitle}>Consultation Schedule</Text>
            <Text style={styles.alertSubtitle}>Configure available days and hours for patient telehealth bookings</Text>
          </View>
        </View>
        <Button
          title="Edit Availability Hours"
          onPress={() => onNavigate('working-hours')}
          size="sm"
          variant="outline"
          style={styles.alertBtn}
        />
      </Card>

      {/* Doctor Quick Tools Grid */}
      <Text style={styles.sectionHeading}>Clinical Management</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('doctor-appointments')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
          </View>
          <Text style={styles.gridTitle}>Appointments</Text>
          <Text style={styles.gridDesc}>Accept, manage & update rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('clinical-notes')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="document-text" size={24} color={colors.secondary} />
          </View>
          <Text style={styles.gridTitle}>Clinical Notes</Text>
          <Text style={styles.gridDesc}>Secure patient diagnosis & records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('doctor-patients')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="people" size={24} color={colors.success} />
          </View>
          <Text style={styles.gridTitle}>My Patients</Text>
          <Text style={styles.gridDesc}>Patient roster & health records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('doctor-circles')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FDF4FF' }]}>
            <Ionicons name="people-circle" size={24} color="#A855F7" />
          </View>
          <Text style={styles.gridTitle}>Safe Circles</Text>
          <Text style={styles.gridDesc}>Manage support communities</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  specializationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  alertCard: {
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTexts: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  alertSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertBtn: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  gridDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  unverifiedBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  unverifiedRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  unverifiedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  unverifiedDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
  },
});
