import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { doctorService } from '../../services/doctorService';
import { clinicalNotesService } from '../../services/clinicalNotesService';

export const DoctorPatientsScreen = ({ onBack, onNavigateToNotes }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientNotes, setPatientNotes] = useState([]);
  const [patientJournals, setPatientJournals] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'journals'

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getMyPatients();
      setPatients(data || []);
    } catch (e) {
      console.warn('Failed to load doctor patients:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const handleOpenPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setDetailsModalVisible(true);
    setActiveTab('notes');
    setLoadingNotes(true);
    setLoadingJournals(true);

    try {
      const notes = await clinicalNotesService.getNotes(patient.id);
      setPatientNotes(notes || []);
    } catch (e) {
      console.warn('Failed to load notes for patient:', e.message);
      setPatientNotes([]);
    } finally {
      setLoadingNotes(false);
    }

    try {
      const journals = await doctorService.getPatientJournals(patient.id);
      setPatientJournals(journals || []);
    } catch (e) {
      console.warn('Failed to load journals for patient:', e.message);
      setPatientJournals([]);
    } finally {
      setLoadingJournals(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>My Clinical Patients</Text>
        <Text style={styles.subtitle}>
          Patients who have consulted with you, their medical contact, and documented histories.
        </Text>
      </View>

      {/* KPI Count */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsNumber}>{patients.length}</Text>
            <Text style={styles.statsLabel}>Total Consulted Patients</Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={28} color={colors.primary} />
          </View>
        </View>
      </Card>

      {/* Patients List */}
      <Text style={styles.sectionHeading}>Patient Directory</Text>
      {loading && patients.length === 0 ? (
        <Text style={styles.loadingText}>Loading patient records...</Text>
      ) : patients.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Registered Patients Yet</Text>
          <Text style={styles.emptyDesc}>
            Patients will automatically appear here once they schedule their first consultation session.
          </Text>
        </Card>
      ) : (
        patients.map((pat) => (
          <Card key={pat.id} style={styles.patientCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarChar}>
                  {pat.user?.full_name ? pat.user.full_name.charAt(0).toUpperCase() : 'P'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.patientName}>{pat.user?.full_name || 'Patient'}</Text>
                <Text style={styles.patientEmail}>{pat.user?.email || 'N/A'}</Text>
                {pat.gender ? (
                  <Text style={styles.patientMeta}>Gender: {pat.gender}</Text>
                ) : null}
              </View>
              <Badge status="ACTIVE" />
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailVal}>
                  {pat.emergency_contact || 'No emergency contact'}
                </Text>
              </View>
              {pat.last_appointment && (
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={[styles.detailVal, { color: colors.primary }]}>
                    Last: {new Date(pat.last_appointment).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              <Button
                title="View Records & Notes"
                size="sm"
                variant="outline"
                icon={<Ionicons name="document-text-outline" size={15} color={colors.primary} />}
                onPress={() => handleOpenPatientDetails(pat)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ))
      )}

      {/* Patient Details & Notes Modal */}
      <Modal visible={detailsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedPatient?.user?.full_name || 'Patient Profile'}
                </Text>
                <Text style={styles.modalSub}>{selectedPatient?.user?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalMetaBox}>
                <Text style={styles.metaLabel}>Emergency Contact:</Text>
                <Text style={styles.metaVal}>{selectedPatient?.emergency_contact || 'N/A'}</Text>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>Date of Birth:</Text>
                <Text style={styles.metaVal}>
                  {selectedPatient?.date_of_birth
                    ? new Date(selectedPatient.date_of_birth).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>

              {/* Tabs */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
                  onPress={() => setActiveTab('notes')}
                >
                  <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
                    Clinical Notes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'journals' && styles.tabActive]}
                  onPress={() => setActiveTab('journals')}
                >
                  <Text style={[styles.tabText, activeTab === 'journals' && styles.tabTextActive]}>
                    Patient Journals
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <>
                  <Text style={styles.modalSectionTitle}>Documented Clinical Notes</Text>
                  {loadingNotes ? (
                    <Text style={styles.loadingText}>Loading notes...</Text>
                  ) : patientNotes.length === 0 ? (
                    <Text style={styles.noNotesText}>No clinical records documented for this patient yet.</Text>
                  ) : (
                    patientNotes.map((n) => (
                      <View key={n.id} style={styles.noteBox}>
                        <Text style={styles.noteDiagnosis}>Diagnosis: {n.diagnosis}</Text>
                        <Text style={styles.notePlan}>Treatment Plan: {n.treatment_plan}</Text>
                        {n.notes ? <Text style={styles.noteObs}>Notes: {n.notes}</Text> : null}
                        <Text style={styles.noteDate}>
                          {new Date(n.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  )}
                </>
              )}

              {/* Journals Tab */}
              {activeTab === 'journals' && (
                <>
                  <Text style={styles.modalSectionTitle}>Patient Journal Entries</Text>
                  {loadingJournals ? (
                    <Text style={styles.loadingText}>Loading journals...</Text>
                  ) : patientJournals.length === 0 ? (
                    <Text style={styles.noNotesText}>No journal entries recorded by this patient yet.</Text>
                  ) : (
                    patientJournals.map((j) => (
                      <View key={j.id} style={styles.journalBox}>
                        <Text style={styles.journalContent}>{j.content}</Text>
                        {j.ai_feedback ? (
                          <View style={styles.aiFeedbackBox}>
                            <Ionicons name="sparkles" size={12} color={colors.primary} />
                            <Text style={styles.aiFeedbackText}>{j.ai_feedback}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.noteDate}>
                          {new Date(j.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  )}
                </>
              )}
            </ScrollView>

            <Button
              title="Close"
              variant="outline"
              size="md"
              onPress={() => setDetailsModalVisible(false)}
              style={{ marginTop: 16 }}
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
    lineHeight: 18,
  },
  statsCard: {
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 14,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 26,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
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
  patientCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  patientEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  patientMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailVal: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
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
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalMetaBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  noNotesText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  noteBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  noteDiagnosis: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  notePlan: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noteObs: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  noteDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { fontSize: 12, fontWeight: '700', color: colors.primary },
  journalBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  journalContent: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  aiFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.primaryMuted,
    padding: 8,
    borderRadius: 8,
  },
  aiFeedbackText: {
    fontSize: 11,
    color: colors.primary,
    flex: 1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
