import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { workingHoursService } from '../../services/workingHoursService';

export const WorkingHoursScreen = ({ onBack }) => {
  const [workingHours, setWorkingHours] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('21:00');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = [
    { key: 'Sunday', label: 'Sun' },
    { key: 'Monday', label: 'Mon' },
    { key: 'Tuesday', label: 'Tue' },
    { key: 'Wednesday', label: 'Wed' },
    { key: 'Thursday', label: 'Thu' },
    { key: 'Friday', label: 'Fri' },
    { key: 'Saturday', label: 'Sat' },
  ];

  const loadHours = async () => {
    setLoading(true);
    try {
      const data = await workingHoursService.getWorkingHours();
      setWorkingHours(data || []);
    } catch (e) {
      console.warn('Failed to load hours', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHours();
  }, []);

  const handleAddHours = async () => {
    if (!startTime || !endTime) {
      Alert.alert('Notice', 'Please specify both start and end times.');
      return;
    }
    setSaving(true);
    try {
      await workingHoursService.setWorkingHours({
        day_of_week: selectedDay,
        start_time: startTime,
        end_time: endTime,
      });
      loadHours();
      Alert.alert('Success', 'Availability slot added to your schedule.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHour = async (id) => {
    try {
      await workingHoursService.deleteWorkingHours(id);
      loadHours();
    } catch (e) {
      console.error(e);
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
        <Text style={styles.title}>Practice Schedule</Text>
        <Text style={styles.subtitle}>Define your weekly available hours for client consultations</Text>
      </View>

      {/* Add Slot Card */}
      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Add Available Time Slot</Text>

        <Text style={styles.fieldLabel}>Day of Week:</Text>
        <View style={styles.daysRow}>
          {days.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayPill, selectedDay === d.key && styles.dayPillActive]}
              onPress={() => setSelectedDay(d.key)}
            >
              <Text style={[styles.dayText, selectedDay === d.key && styles.dayTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timesRow}>
          <View style={styles.timeCol}>
            <InputField
              label="Start Time (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="17:00"
            />
          </View>
          <View style={styles.timeCol}>
            <InputField
              label="End Time (HH:MM)"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="21:00"
            />
          </View>
        </View>

        <Button
          title={saving ? 'Saving...' : 'Add Slot to Schedule'}
          onPress={handleAddHours}
          loading={saving}
          size="md"
        />
      </Card>

      {/* Current Working Hours */}
      <Text style={styles.slotsHeading}>Active Working Slots</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading schedule...</Text>
      ) : workingHours.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="time-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Working Hours Configured</Text>
          <Text style={styles.emptyDesc}>Add slots above so patients can book appointments with you.</Text>
        </Card>
      ) : (
        workingHours.map((wh) => (
          <Card key={wh.id} style={styles.slotCard}>
            <View style={styles.slotRow}>
              <View style={styles.slotInfo}>
                <Text style={styles.slotDayName}>{wh.day_of_week}</Text>
                <Text style={styles.slotTimes}>
                  {wh.start_time} - {wh.end_time}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteHour(wh.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        ))
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
  formCard: {
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  timesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    flex: 1,
  },
  slotsHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
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
  slotCard: {
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotInfo: {},
  slotDayName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  slotTimes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
});
