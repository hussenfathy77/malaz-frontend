import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { toolkitService } from '../../services/toolkitService';

export const PatientHomeScreen = ({ onNavigate }) => {
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState(null);
  const [quickScore, setQuickScore] = useState(8);
  const [savingMood, setSavingMood] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moodFeedbackModal, setMoodFeedbackModal] = useState(false);
  const [loggedMoodData, setLoggedMoodData] = useState(null);

  const loadData = async () => {
    try {
      const appointments = await appointmentService.getMyAppointments();
      const upcoming = appointments.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING');
      setNextAppointment(upcoming || null);
    } catch (e) {
      console.warn('Error loading patient home data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMoodFeedback = (score) => {
    if (score >= 8) {
      return {
        badge: 'يوم مشرق ومبهج 🌟',
        title: 'طاقة إيجابية وفرحة غامرة!',
        description: 'سعداء جداً بأنك تشعر بالراحة والتفاؤل اليوم! استمتع بكل لحظة واحتفل بطاقتك الإيجابية.',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        textColor: '#065F46',
        btnText: 'استمر في التألق ✨',
      };
    } else if (score >= 6) {
      return {
        badge: 'حالة متوازنة ومستقرة 🙂',
        title: 'يوم هادئ ومطمئن',
        description: 'التوازن والهدوء الداخلي خطوة ممتازة. استمر في يومك بثبات وراحة بال واعتنِ بنفسك.',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        textColor: '#166534',
        btnText: 'رائع، شكراً لك 🌿',
      };
    } else {
      return {
        badge: 'نحن بجانبك دائماً 🤍',
        title: 'لا بأس، كل يوم بداية جديدة',
        description: 'من الطبيعي أن نمر بلحظات صعبة وضغط أحياناً. خذ نفساً عميقاً وامنح نفسك بعض الراحة، ومختصونا في ملاذ دائماً هنا لدعمك.',
        bg: '#FEF3C7',
        border: '#FDE68A',
        textColor: '#92400E',
        btnText: 'أنا ممتن، شكراً لك 🤍',
      };
    }
  };

  const handleQuickMoodSave = async () => {
    setSavingMood(true);
    try {
      await toolkitService.addMood({ mood_score: quickScore, note: 'Logged from home screen' });
      setLoggedMoodData({
        score: quickScore,
        emoji: moodEmojis[quickScore] || '🌿',
      });
      setMoodFeedbackModal(true);
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Notice', 'Could not save your mood check-in. Please try again.');
    } finally {
      setSavingMood(false);
    }
  };

  const moodEmojis = {
    2: '😔',
    4: '😐',
    6: '🙂',
    8: '😊',
    10: '🌟',
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
      {/* Welcome Banner */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome, {firstName} 🌿</Text>
        <Text style={styles.quote}>
          "Your mental health is a priority. Take a breath and invest in your well-being today."
        </Text>
      </View>

      {/* Quick Mood Log Card */}
      <Card style={styles.moodCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardSectionTitle}>How are you feeling today?</Text>
          <TouchableOpacity onPress={() => onNavigate('moods')}>
            <Text style={styles.seeAllText}>View History →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.moodSubtitle}>Select your current mood score to track your progress</Text>

        <View style={styles.moodScoreRow}>
          {[2, 4, 6, 8, 10].map((score) => {
            const isSelected = quickScore === score;
            return (
              <TouchableOpacity
                key={score}
                style={[styles.scoreBubble, isSelected && styles.scoreBubbleActive]}
                onPress={() => setQuickScore(score)}
                activeOpacity={0.7}
              >
                <Text style={styles.scoreEmoji}>{moodEmojis[score]}</Text>
                <Text style={[styles.scoreNumber, isSelected && styles.scoreNumberActive]}>{score}/10</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={savingMood ? 'Saving...' : 'Log Mood Check-In'}
          onPress={handleQuickMoodSave}
          loading={savingMood}
          size="sm"
          style={styles.saveMoodBtn}
        />
      </Card>

      {/* Next Appointment Card */}
      {nextAppointment && (
        <Card style={styles.appointmentCard}>
          <View style={styles.aptHeader}>
            <Text style={styles.aptSectionTitle}>Upcoming Consultation</Text>
            <Badge status={nextAppointment.status} />
          </View>

          <View style={styles.aptBody}>
            <View style={styles.docAvatarCircle}>
              <Ionicons name="medical" size={24} color={colors.primary} />
            </View>
            <View style={styles.aptInfo}>
              <Text style={styles.docName}>
                {nextAppointment.doctor?.user?.full_name || 'Assigned Specialist'}
              </Text>
              <Text style={styles.docSpec}>
                {nextAppointment.doctor?.specialization || 'Clinical Mental Health'}
              </Text>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.timeText}>
                  {nextAppointment.date ? new Date(nextAppointment.date).toLocaleDateString() : 'Scheduled'} • {nextAppointment.start_time || 'Session'}
                </Text>
              </View>
            </View>
          </View>

          {nextAppointment.meeting_link && (
            <Button
              title="Join Telehealth Video Session"
              icon={<Ionicons name="videocam-outline" size={18} color="#FFFFFF" />}
              onPress={() => onNavigate('appointments')}
              size="md"
              style={styles.joinBtn}
            />
          )}
        </Card>
      )}

      {/* Quick Navigation Features Grid */}
      <Text style={styles.featuresHeading}>Care Tools & Community</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('doctors')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <Text style={styles.gridTitle}>Specialists</Text>
          <Text style={styles.gridDesc}>Book verified doctors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('journals')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="book" size={24} color={colors.secondary} />
          </View>
          <Text style={styles.gridTitle}>Journaling</Text>
          <Text style={styles.gridDesc}>Guided reflections & logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('circles')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="chatbubbles" size={24} color={colors.warning} />
          </View>
          <Text style={styles.gridTitle}>Safe Circles</Text>
          <Text style={styles.gridDesc}>Supportive communities</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('caregivers')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FFE4E6' }]}>
            <Ionicons name="heart" size={24} color={colors.rose} />
          </View>
          <Text style={styles.gridTitle}>Caregivers</Text>
          <Text style={styles.gridDesc}>Family & support network</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onNavigate('nearby-doctors')}
          activeOpacity={0.8}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="map" size={24} color={colors.emerald} />
          </View>
          <Text style={styles.gridTitle}>Nearby Clinics</Text>
          <Text style={styles.gridDesc}>Find in-person doctors</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

      {/* Mood Check-In Feedback Modal */}
      <Modal visible={moodFeedbackModal} transparent animationType="fade">
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackCard}>
            {loggedMoodData && (() => {
              const feedback = getMoodFeedback(loggedMoodData.score);
              return (
                <>
                  <View style={[styles.feedbackEmojiCircle, { backgroundColor: feedback.bg, borderColor: feedback.border }]}>
                    <Text style={styles.feedbackEmojiLarge}>{loggedMoodData.emoji}</Text>
                  </View>

                  <View style={[styles.feedbackBadge, { backgroundColor: feedback.bg, borderColor: feedback.border }]}>
                    <Text style={[styles.feedbackBadgeText, { color: feedback.textColor }]}>
                      {feedback.badge}
                    </Text>
                  </View>

                  <Text style={styles.feedbackScoreTitle}>
                    تقييم المزاج: {loggedMoodData.score} / 10
                  </Text>

                  <Text style={styles.feedbackHeading}>{feedback.title}</Text>

                  <Text style={styles.feedbackParagraph}>{feedback.description}</Text>

                  <View style={styles.feedbackActionCol}>
                    <TouchableOpacity
                      style={[styles.feedbackCloseBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setMoodFeedbackModal(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.feedbackCloseBtnText}>{feedback.btnText}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.feedbackHistoryBtn}
                      onPress={() => {
                        setMoodFeedbackModal(false);
                        onNavigate('moods');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.feedbackHistoryBtnText}>معاينة السجل التفصيلي →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
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
  welcomeSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'left',
  },
  quote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'left',
    marginTop: 6,
    lineHeight: 20,
  },
  moodCard: {
    marginBottom: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  moodSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  moodScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreBubble: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 54,
  },
  scoreBubbleActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  scoreEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scoreNumberActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  saveMoodBtn: {
    alignSelf: 'stretch',
  },
  appointmentCard: {
    marginBottom: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aptSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  aptBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  docAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  docSpec: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  joinBtn: {
    marginTop: 6,
  },
  featuresHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridIconCircle: {
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
  },
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  feedbackEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 14,
  },
  feedbackEmojiLarge: {
    fontSize: 36,
  },
  feedbackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  feedbackBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackScoreTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  feedbackHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackParagraph: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  feedbackActionCol: {
    width: '100%',
    gap: 10,
  },
  feedbackCloseBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackHistoryBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackHistoryBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
