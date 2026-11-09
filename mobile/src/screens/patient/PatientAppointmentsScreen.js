import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';

export const PatientAppointmentsScreen = ({ onBack, onJoinCall }) => {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED'
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const filtered = appointments.filter(a => {
    if (activeTab === 'UPCOMING') return a.status === 'CONFIRMED' || a.status === 'PENDING';
    if (activeTab === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
  });

  const handleCancelAppointment = (id) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this scheduled consultation?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.updateAppointmentStatus(id, 'CANCELLED');
              loadAppointments();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleOpenReview = (apt) => {
    setSelectedAppointment(apt);
    setRating(5);
    setComment('');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    const doctorId =
      selectedAppointment?.doctor_id ||
      selectedAppointment?.doctor?.id ||
      selectedAppointment?.doctor?.user_id;

    if (!doctorId) {
      Alert.alert('Notice', 'Doctor information is unavailable for this session.');
      return;
    }
    setSubmittingReview(true);
    try {
      await doctorService.createReview(doctorId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewModalVisible(false);
      Alert.alert('Review Submitted', 'Thank you! Your feedback has been recorded.');
      loadAppointments();
    } catch (err) {
      Alert.alert('Review Error', err.message || 'Unable to submit review at this time.');
    } finally {
      setSubmittingReview(false);
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
        <Text style={styles.title}>My Consultations</Text>
        <Text style={styles.subtitle}>Manage your upcoming therapy appointments and telehealth links</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>All Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setActiveTab('UPCOMING')}
        >
          <Text style={[styles.tabText, activeTab === 'UPCOMING' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'COMPLETED' && styles.tabActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <Text style={styles.emptyText}>Loading appointments...</Text>
      ) : filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Sessions Found</Text>
          <Text style={styles.emptySubtitle}>You don't have any appointments in this view.</Text>
        </Card>
      ) : (
        filtered.map((apt) => (
          <Card key={apt.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{apt.doctor?.user?.full_name || 'Specialist Doctor'}</Text>
                <Text style={styles.docSpec}>{apt.doctor?.specialization || 'Mental Health'}</Text>
              </View>
              <Badge status={apt.status} />
            </View>

            <View style={styles.timeDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>
                  {apt.date ? new Date(apt.date).toLocaleDateString() : 'Scheduled'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>{apt.start_time || 'Session time'}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              {/* Appointment type badge */}
              {apt.appointment_type === 'OFFLINE' ? (
                <View style={styles.offlineBadge}>
                  <Ionicons name="location-outline" size={13} color="#B45309" />
                  <Text style={styles.offlineBadgeText}>In-Person</Text>
                </View>
              ) : null}

              {apt.status === 'CONFIRMED' && apt.meeting_link && apt.appointment_type !== 'OFFLINE' && (
                <Button
                  title="Join Video Room"
                  size="sm"
                  icon={<Ionicons name="videocam-outline" size={16} color="#FFFFFF" />}
                  style={styles.actionBtn}
                  onPress={() => onJoinCall ? onJoinCall(apt) : null}
                />
              )}

              {apt.status === 'COMPLETED' && (
                <Button
                  title="Review Session"
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="star-outline" size={15} color={colors.primary} />}
                  onPress={() => handleOpenReview(apt)}
                  style={styles.actionBtn}
                />
              )}

              {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                <Button
                  title="Cancel"
                  variant="ghost"
                  size="sm"
                  onPress={() => handleCancelAppointment(apt.id)}
                  textStyle={{ color: colors.danger }}
                />
              )}
            </View>
          </Card>
        ))
      )}

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocName}>
              Session with {selectedAppointment?.doctor?.user?.full_name}
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons
                    name={s <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <InputField
              label="Comments & Clinical Feedback"
              value={comment}
              onChangeText={setComment}
              placeholder="How did you find this consultation? Was the specialist attentive?"
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit Review"
              onPress={handleSubmitReview}
              loading={submittingReview}
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  docSpec: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeDetails: {
    flexDirection: 'row',
    gap: 16,
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
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalDocName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
});
