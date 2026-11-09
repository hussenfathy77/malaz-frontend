import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { appointmentService } from '../../services/appointmentService';
import { clinicalNotesService } from '../../services/clinicalNotesService';

export const DoctorAppointmentsScreen = ({ onBack, onJoinCall }) => {
  const [appointments, setAppointments] = useState([]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      loadAppointments();
      Alert.alert('Status Updated', `Appointment set to ${status}.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleOpenNoteModal = (apt) => {
    setSelectedAppointment(apt);
    setDiagnosis('');
    setTreatmentPlan('');
    setSessionNotes('');
    setNoteModalVisible(true);
  };

  const handleSaveClinicalNote = async () => {
    if (!diagnosis || !treatmentPlan) {
      Alert.alert('Required Fields', 'Diagnosis and Treatment Plan are required.');
      return;
    }
    setSavingNote(true);
    try {
      await clinicalNotesService.createNote({
        appointment_id: selectedAppointment.id,
        patient_id: selectedAppointment.patient_id,
        diagnosis,
        treatment_plan: treatmentPlan,
        notes: sessionNotes,
      });
      setNoteModalVisible(false);
      Alert.alert('Saved', 'Clinical note recorded and attached to patient medical profile.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Client Appointments</Text>
        <Text style={styles.subtitle}>Confirm sessions, start telehealth video calls, and document clinical records</Text>
      </View>

      {/* List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading client appointments...</Text>
      ) : appointments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Appointments Yet</Text>
          <Text style={styles.emptyDesc}>New client consultations will be displayed here.</Text>
        </Card>
      ) : (
        appointments.map((apt) => (
          <Card key={apt.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{apt.patient?.user?.full_name || 'Registered Patient'}</Text>
                <Text style={styles.aptTime}>
                  {apt.date ? new Date(apt.date).toLocaleDateString() : 'Scheduled'} • {apt.start_time} - {apt.end_time}
                </Text>
              </View>
              <Badge status={apt.status} />
            </View>

            <View style={styles.actionsRow}>
              {apt.status === 'PENDING' && (
                <>
                  <Button
                    title="Confirm"
                    size="sm"
                    onPress={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Decline"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                    textStyle={{ color: colors.danger }}
                  />
                </>
              )}

              {apt.status === 'CONFIRMED' && (
                <>
                  {apt.appointment_type !== 'OFFLINE' && (
                    <Button
                      title="Start Call"
                      size="sm"
                      icon={<Ionicons name="videocam-outline" size={16} color="#FFFFFF" />}
                      onPress={() => onJoinCall ? onJoinCall(apt) : null}
                      style={styles.actionBtn}
                    />
                  )}
                  {apt.appointment_type === 'OFFLINE' && (
                    <View style={styles.offlineBadge}>
                      <Ionicons name="location-outline" size={13} color="#B45309" />
                      <Text style={styles.offlineBadgeText}>In-Person</Text>
                    </View>
                  )}
                  <Button
                    title="Complete"
                    variant="outline"
                    size="sm"
                    onPress={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                  />
                </>
              )}

              {apt.status === 'COMPLETED' && (
                <Button
                  title="Add Clinical Note"
                  size="sm"
                  variant="secondary"
                  icon={<Ionicons name="create-outline" size={15} color="#FFFFFF" />}
                  onPress={() => handleOpenNoteModal(apt)}
                  style={styles.actionBtn}
                />
              )}
            </View>
          </Card>
        ))
      )}

      {/* Clinical Note Modal */}
      <Modal visible={noteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Document Clinical Note</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Diagnosis / Primary Impression *"
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="e.g. Mild generalized anxiety, Adjustment disorder"
            />

            <InputField
              label="Treatment Plan / Prescribed Homework *"
              value={treatmentPlan}
              onChangeText={setTreatmentPlan}
              placeholder="e.g. Daily CBT journaling, breathing exercises"
              multiline
              numberOfLines={2}
            />

            <InputField
              label="Confidential Clinical Observations"
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Detailed notes (stored securely in health records)..."
              multiline
              numberOfLines={3}
            />

            <Button
              title="Save to Clinical File"
              onPress={handleSaveClinicalNote}
              loading={savingNote}
              size="lg"
            />
          </View>
        </View>
      </Modal>
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
  backBtn: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 26,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  aptTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
});
