import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { caregiverService } from '../../services/caregiverService';
import { useAuth } from '../../context/AuthContext';

export const CaregiverHomeScreen = ({ onNavigate }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending invitations sent to this caregiver
      const invs = await caregiverService.getMyInvitations();
      setInvitations(invs || []);

      // 2. Fetch active linked patients
      const pts = await caregiverService.getMyPatients();
      setPatients(pts || []);

      // 3. If there are active patients, load summary for selected or first
      const currentPatId = selectedPatientId || (pts.length > 0 ? pts[0].patient_id : null);
      if (currentPatId) {
        setSelectedPatientId(currentPatId);
        const sum = await caregiverService.getCaregiverSummary(currentPatId);
        setSummary(sum?.data || sum);
      } else {
        setSummary(null);
      }
    } catch (e) {
      console.warn('Caregiver data load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (relId, newStatus) => {
    try {
      await caregiverService.updateCaregiverStatus(relId, newStatus);
      Alert.alert(
        newStatus === 'ACTIVE' ? 'Invitation Accepted' : 'Invitation Declined',
        `Relationship has been updated successfully.`
      );
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update invitation status.');
    }
  };

  const handleSelectPatient = async (patId) => {
    setSelectedPatientId(patId);
    try {
      const sum = await caregiverService.getCaregiverSummary(patId);
      setSummary(sum?.data || sum);
    } catch (err) {
      console.warn('Failed to load patient summary:', err.message);
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
        <Text style={styles.title}>Caregiver Portal</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.full_name || 'Caregiver'}. Monitor authorized patient wellness and scheduled check-ins.
        </Text>
      </View>

      {/* Patient Selector Tabs (if multiple patients linked) */}
      {patients.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientTabs}>
          {patients.map((link) => {
            const isSelected = selectedPatientId === link.patient_id;
            const patName = link.patient?.user?.full_name || 'Patient';
            return (
              <TouchableOpacity
                key={link.id}
                style={[styles.patientTab, isSelected && styles.patientTabActive]}
                onPress={() => handleSelectPatient(link.patient_id)}
              >
                <Ionicons
                  name="person"
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.patientTabText, isSelected && styles.patientTabTextActive]}>
                  {patName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Linked Patient Summary Card */}
      {summary ? (
        <Card style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{summary.patient?.full_name || 'Assigned Patient'}</Text>
              <Text style={styles.patientMeta}>
                Emergency Contact: {summary.patient?.emergency_contact || 'Registered'}
              </Text>
              <Text style={styles.patientMeta}>
                Email: {summary.patient?.email || 'N/A'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>ACTIVE CARE</Text>
            </View>
          </View>

          {/* Activity Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{summary.moodCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Mood Logs</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: colors.secondary }]}>
                {summary.upcomingAppointments?.length ?? 0}
              </Text>
              <Text style={styles.metricLabel}>Upcoming Sessions</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {summary.recentMoods && summary.recentMoods.length > 0
                  ? Math.round(
                      summary.recentMoods.reduce((acc, m) => acc + m.mood_score, 0) /
                        summary.recentMoods.length
                    ) + '/10'
                  : 'N/A'}
              </Text>
              <Text style={styles.metricLabel}>Avg Recent Mood</Text>
            </View>
          </View>

          {/* Recent Mood History */}
          {summary.recentMoods && summary.recentMoods.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Mood Logs</Text>
              {summary.recentMoods.slice(0, 3).map((m) => (
                <View key={m.id} style={styles.moodItem}>
                  <View style={styles.moodScoreBubble}>
                    <Text style={styles.moodScoreNum}>{m.mood_score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moodNote} numberOfLines={1}>
                      {m.note || 'No note recorded'}
                    </Text>
                    <Text style={styles.moodTime}>
                      {new Date(m.logged_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="heart-half-outline" size={38} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Active Patient Monitored</Text>
          <Text style={styles.emptyDesc}>
            Accept an invitation below or ask a patient to send a connection request to your email.
          </Text>
        </Card>
      )}

      {/* Pending Invitations Section */}
      <Text style={styles.sectionHeading}>Pending Connection Requests ({invitations.length})</Text>
      {loading && invitations.length === 0 ? (
        <Text style={styles.loadingText}>Loading requests...</Text>
      ) : invitations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="mail-open-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Pending Invites</Text>
          <Text style={styles.emptyDesc}>New connection invites from patients will appear here.</Text>
        </Card>
      ) : (
        invitations.map((inv) => (
          <Card key={inv.id} style={styles.relCard}>
            <View style={styles.relTop}>
              <View style={styles.relInfo}>
                <Text style={styles.relEmail}>
                  {inv.patient?.user?.full_name || 'Patient'} ({inv.patient?.user?.email || 'N/A'})
                </Text>
                <Text style={styles.relScope}>
                  Consent Scope: {inv.consent_scope || 'General Wellness Monitoring'}
                </Text>
                <Text style={styles.relDate}>
                  Invited on: {new Date(inv.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge status="PENDING" />
            </View>

            <View style={styles.relActions}>
              <Button
                title="Accept Connection"
                size="sm"
                onPress={() => handleUpdateStatus(inv.id, 'ACTIVE')}
                style={{ flex: 1 }}
              />
              <Button
                title="Decline"
                variant="ghost"
                size="sm"
                onPress={() => handleUpdateStatus(inv.id, 'REVOKED')}
                textStyle={{ color: colors.danger }}
              />
            </View>
          </Card>
        ))
      )}

      {/* Active Patients Section */}
      {patients.length > 0 && (
        <>
          <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Active Linked Patients ({patients.length})</Text>
          {patients.map((p) => (
            <Card key={p.id} style={styles.relCard}>
              <View style={styles.relTop}>
                <View style={styles.relInfo}>
                  <Text style={styles.relEmail}>{p.patient?.user?.full_name || 'Patient'}</Text>
                  <Text style={styles.relScope}>Scope: {p.consent_scope || 'General'}</Text>
                  <Text style={styles.relDate}>
                    Connected: {p.granted_at ? new Date(p.granted_at).toLocaleDateString() : 'Active'}
                  </Text>
                </View>
                <Badge status="ACTIVE" />
              </View>

              <View style={styles.relActions}>
                <Button
                  title={selectedPatientId === p.patient_id ? 'Currently Viewing' : 'View Summary'}
                  size="sm"
                  variant={selectedPatientId === p.patient_id ? 'secondary' : 'outline'}
                  onPress={() => handleSelectPatient(p.patient_id)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Revoke Access"
                  variant="ghost"
                  size="sm"
                  onPress={() => handleUpdateStatus(p.id, 'REVOKED')}
                  textStyle={{ color: colors.danger }}
                />
              </View>
            </Card>
          ))}
        </>
      )}
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
  patientTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  patientTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  patientTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  patientTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  patientTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  patientCard: {
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  patientMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  moodScoreBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScoreNum: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  moodNote: {
    fontSize: 12,
    color: colors.text,
  },
  moodTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 26,
    marginBottom: 20,
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
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: 12,
  },
  relCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relInfo: {
    flex: 1,
    marginRight: 10,
  },
  relEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  relScope: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  relDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  relActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
