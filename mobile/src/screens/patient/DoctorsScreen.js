import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';

export const DoctorsScreen = ({ onBack, onNavigateToAppointments }) => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [payingLoading, setPayingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await doctorService.getDoctors();
        setDoctors(data || []);
      } catch (e) {
        console.error('Failed to load doctors', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filteredDoctors = doctors.filter(d => {
    const name = (d.user?.full_name || '').toLowerCase();
    const spec = (d.specialization || '').toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || spec.includes(query);
  });

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [availableHourlySlots, setAvailableHourlySlots] = useState([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState('ONLINE');

  const fetchDoctorAvailability = async (doctorId, targetDate) => {
    setLoadingSlots(true);
    try {
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const slots = await doctorService.getDoctorAvailability(doctorId, dateStr);
      setAvailableHourlySlots(slots || []);
      if (slots && slots.length > 0) {
        setSelectedSlotTime(slots[0]);
      } else {
        setSelectedSlotTime('');
      }
    } catch (e) {
      console.warn('Could not fetch slots:', e.message);
      setAvailableHourlySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateAppointmentDate = (slot) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIdx = dayNames.findIndex(
      (d) => d.toLowerCase() === (slot?.day_of_week || 'Monday').trim().toLowerCase()
    );

    const parseTime = (timeStr) => {
      if (!timeStr) return { hours: 10, minutes: 0 };
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return { hours: 10, minutes: 0 };
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3];
      if (modifier) {
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      return { hours, minutes };
    };

    const { hours, minutes } = parseTime(slot?.start_time || '10:00 AM');
    const date = new Date();
    const currentDayIdx = date.getDay();
    let daysToAdd = (targetDayIdx - currentDayIdx + 7) % 7;

    // If target day is today and time passed, schedule next week
    if (daysToAdd === 0) {
      const currentMins = date.getHours() * 60 + date.getMinutes();
      const slotMins = hours * 60 + minutes;
      if (currentMins >= slotMins) {
        daysToAdd = 7;
      }
    }

    date.setDate(date.getDate() + daysToAdd);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleOpenBooking = (doc) => {
    setSelectedDoctor(doc);
    const initialSlot = (doc.working_hours && doc.working_hours.length > 0)
      ? doc.working_hours[0]
      : { day_of_week: 'Monday', start_time: '10:00 AM', end_time: '04:00 PM' };
    setSelectedSlot(initialSlot);
    setPaymentSuccess(false);
    setAppointmentType('ONLINE');
    setBookingModalVisible(true);

    const targetDate = calculateAppointmentDate(initialSlot);
    fetchDoctorAvailability(doc.id, targetDate);
  };

  const handleSelectWorkingDay = (slot) => {
    setSelectedSlot(slot);
    if (selectedDoctor) {
      const targetDate = calculateAppointmentDate(slot);
      fetchDoctorAvailability(selectedDoctor.id, targetDate);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor) return;
    setBookingLoading(true);

    try {
      const slot = selectedSlot || (selectedDoctor.working_hours?.[0]) || {
        day_of_week: 'Monday',
        start_time: '10:00 AM',
        end_time: '04:00 PM',
      };

      const targetDate = calculateAppointmentDate(slot);
      
      // If hourly slot selected from availability endpoint, adjust hours/minutes
      let startTime = slot.start_time || '10:00 AM';
      let endTime = slot.end_time || '11:00 AM';

      if (selectedSlotTime) {
        const parts = selectedSlotTime.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || '0', 10);
        targetDate.setHours(h, m, 0, 0);

        startTime = selectedSlotTime;
        const endHour = String(h + 1).padStart(2, '0');
        endTime = `${endHour}:${String(m).padStart(2, '0')}`;
      }

      const res = await appointmentService.bookAppointment({
        doctor_id: selectedDoctor.id,
        date: targetDate.toISOString(),
        start_time: startTime,
        end_time: endTime,
        appointment_type: appointmentType,
      });

      setBookingModalVisible(false);
      setCreatedAppointment(res);
      setPaymentSuccess(false);
      setPaymentModalVisible(true);
    } catch (err) {
      console.warn('Booking error:', err.message);
      Alert.alert(
        'Booking Notification',
        err.message || 'Unable to schedule slot. Please select another available consultation time.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePay = async () => {
    if (!createdAppointment) return;
    setPayingLoading(true);
    try {
      await appointmentService.payAppointment(createdAppointment.id);
      setPaymentSuccess(true);
    } catch (err) {
      console.warn('Payment error:', err.message);
      Alert.alert('Payment Notice', err.message || 'Payment simulation encountered an issue.');
    } finally {
      setPayingLoading(false);
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
        <Text style={styles.title}>Find Specialists</Text>
        <Text style={styles.subtitle}>Connect with licensed mental health professionals for confidential telehealth consultations</Text>
      </View>

      {/* Search Bar */}
      <InputField
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, therapy approach, or specialty..."
        leftIcon={<Ionicons name="search" size={20} color={colors.textSecondary} />}
        style={styles.searchBar}
      />

      {loading ? (
        <Text style={styles.emptyText}>Loading specialists...</Text>
      ) : filteredDoctors.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyCardTitle}>No Specialists Found</Text>
          <Text style={styles.emptyCardDesc}>No doctors are registered matching your criteria. Please check back soon.</Text>
        </Card>
      ) : (
        filteredDoctors.map((doc) => (
          <Card key={doc.id} style={styles.docCard}>
            <View style={styles.docTopRow}>
              {doc.user?.profile_pic ? (
                <Image source={{ uri: doc.user.profile_pic }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              )}

              <View style={styles.docDetailsCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {doc.user?.full_name || 'Specialist'}
                  </Text>
                  {doc.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={11} color="#0D9488" />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.docSpecialization} numberOfLines={1}>{doc.specialization}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{doc.avg_rating ? Number(doc.avg_rating).toFixed(1) : '5.0'} • Clinical Excellence</Text>
                </View>
              </View>
            </View>

            {doc.bio ? <Text style={styles.docBio}>{doc.bio}</Text> : null}

            <View style={styles.docFooterRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Session Fee (50 min)</Text>
                <Text style={styles.priceVal}>{doc.session_price != null ? `${doc.session_price} EGP` : '120 EGP'}</Text>
              </View>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => handleOpenBooking(doc)}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
                <Text style={styles.bookBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Session</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDocName}>With {selectedDoctor?.user?.full_name}</Text>

            {/* Session Type Toggle */}
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeToggleBtn, appointmentType === 'ONLINE' && styles.typeToggleBtnActive]}
                onPress={() => setAppointmentType('ONLINE')}
              >
                <Ionicons name="videocam-outline" size={15} color={appointmentType === 'ONLINE' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.typeToggleText, appointmentType === 'ONLINE' && styles.typeToggleTextActive]}>Online</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggleBtn, appointmentType === 'OFFLINE' && styles.typeToggleBtnActive]}
                onPress={() => setAppointmentType('OFFLINE')}
              >
                <Ionicons name="location-outline" size={15} color={appointmentType === 'OFFLINE' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.typeToggleText, appointmentType === 'OFFLINE' && styles.typeToggleTextActive]}>In-Person</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select an available time slot:</Text>

            <View style={styles.slotsContainer}>
              {selectedDoctor?.working_hours?.length ? (
                selectedDoctor.working_hours.map((slot, idx) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id || idx}
                      style={[styles.slotPill, isSelected && styles.slotPillActive]}
                      onPress={() => handleSelectWorkingDay(slot)}
                    >
                      <Text style={[styles.slotDay, isSelected && styles.slotTextActive]}>
                        {slot.day_of_week}
                      </Text>
                      <Text style={[styles.slotTime, isSelected && styles.slotTextActive]}>
                        {slot.start_time} - {slot.end_time}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.slotPillActive}>
                  <Text style={styles.slotDay}>Consultation Hours</Text>
                  <Text style={styles.slotTime}>17:00 - 21:00</Text>
                </View>
              )}
            </View>

            {/* Live Hourly Available Slots from Backend */}
            <Text style={styles.hourlyLabel}>Live Available Hours:</Text>
            {loadingSlots ? (
              <Text style={styles.hourlyLoading}>Checking real-time calendar availability...</Text>
            ) : availableHourlySlots.length > 0 ? (
              <View style={styles.hourlyRow}>
                {availableHourlySlots.map((hSlot) => {
                  const isHourSelected = selectedSlotTime === hSlot;
                  return (
                    <TouchableOpacity
                      key={hSlot}
                      style={[styles.hourPill, isHourSelected && styles.hourPillActive]}
                      onPress={() => setSelectedSlotTime(hSlot)}
                    >
                      <Text style={[styles.hourText, isHourSelected && styles.hourTextActive]}>
                        {hSlot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.hourlyNone}>All consultation slots booked for this day.</Text>
            )}

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTotal}>Total: ${selectedDoctor?.session_price || '120'}</Text>
              <Text style={styles.summaryNote}>
                {appointmentType === 'OFFLINE'
                  ? 'In-person consultation at the doctor\'s clinic location.'
                  : 'Secured telehealth video session with certified specialist.'}
              </Text>
            </View>

            <Button
              title="Confirm & Proceed to Payment"
              onPress={handleConfirmBooking}
              loading={bookingLoading}
              size="lg"
            />
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {paymentSuccess ? (
              <View style={styles.successWrapper}>
                <View style={[styles.payIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
                </View>
                <Text style={styles.payTitle}>Booking Confirmed! 🎉</Text>
                <Text style={styles.payDesc}>
                  Your therapy session with {selectedDoctor?.user?.full_name} has been successfully scheduled and confirmed.
                </Text>

                <View style={styles.successMetaBox}>
                  <Text style={styles.successMetaLabel}>Status: Confirmed & Paid</Text>
                  <Text style={styles.successMetaText}>
                    Telehealth access link has been linked to your appointments dashboard.
                  </Text>
                </View>

                <Button
                  title="View My Consultations"
                  onPress={() => {
                    setPaymentModalVisible(false);
                    if (onNavigateToAppointments) onNavigateToAppointments();
                  }}
                  size="lg"
                  style={{ marginBottom: 10 }}
                />
                <Button
                  title="Close"
                  variant="outline"
                  onPress={() => setPaymentModalVisible(false)}
                  size="md"
                />
              </View>
            ) : (
              <>
                <View style={styles.payIconCircle}>
                  <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                </View>
                <Text style={styles.payTitle}>Complete Payment</Text>
                <Text style={styles.payDesc}>
                  Session with {selectedDoctor?.user?.full_name} (${selectedDoctor?.session_price || '120'})
                </Text>

                <View style={styles.cardPreview}>
                  <Text style={styles.cardPreviewNum}>•••• •••• •••• 4242</Text>
                  <View style={styles.cardPreviewRow}>
                    <Text style={styles.cardPreviewText}>12/28</Text>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                  </View>
                </View>

                <Button
                  title="Authorize Payment"
                  onPress={handlePay}
                  loading={payingLoading}
                  size="lg"
                  style={{ marginBottom: 10 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setPaymentModalVisible(false)}
                  size="md"
                />
              </>
            )}
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
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: 4,
    lineHeight: 19,
  },
  searchBar: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 30,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyCardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  docCard: {
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDetailsCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    flexShrink: 0,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  docSpecialization: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  docBio: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  docFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  priceVal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    flexShrink: 0,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalDocName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  slotPill: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotDay: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  slotTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  slotTextActive: {
    color: colors.primary,
  },
  summaryBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  summaryNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeToggleBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  payIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  payTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  payDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardPreview: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
  },
  cardPreviewNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  successWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  successMetaBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  successMetaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
    textAlign: 'center',
  },
  successMetaText: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
  },
  hourlyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  hourlyLoading: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  hourlyNone: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 14,
  },
  hourlyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hourPill: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  hourTextActive: {
    color: '#FFFFFF',
  },
});
