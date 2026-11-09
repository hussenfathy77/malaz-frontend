import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { toolkitService } from '../../services/toolkitService';

export const MoodTrackerScreen = ({ onBack }) => {
  const [moodScore, setMoodScore] = useState(7);
  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState('Calm 🕊️');
  const [moodsHistory, setMoodsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tags = ['Grateful 🌿', 'Calm 🕊️', 'Optimistic ✨', 'Stressed ⚡', 'Anxious 🌪️', 'Low 🌧️', 'Joyful ☀️'];

  const loadMoods = async () => {
    setLoading(true);
    try {
      const data = await toolkitService.getMoods();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.trends)
        ? data.trends
        : Array.isArray(data?.moods)
        ? data.moods
        : [];
      setMoodsHistory(list);
    } catch (e) {
      console.warn('Failed to fetch moods', e);
      setMoodsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoods();
  }, []);

  const handleSaveMood = async () => {
    setSubmitting(true);
    try {
      const finalNote = selectedTag ? `[${selectedTag}] ${note}`.trim() : note;
      await toolkitService.addMood({ mood_score: moodScore, note: finalNote });
      setNote('');
      loadMoods();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return colors.primary;
    if (score >= 5) return colors.accent;
    return colors.rose;
  };

  const getScoreDescriptor = (score) => {
    if (score >= 9) return '🌟 Excellent & Serene';
    if (score >= 7) return '😊 Good & Balanced';
    if (score >= 5) return '😐 Neutral & Steady';
    if (score >= 3) return '😔 Low & Uneasy';
    return '🌧️ Struggling & Overwhelmed';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Daily Mood Tracker</Text>
        <Text style={styles.subtitle}>Tracking your emotions daily helps identify trends and maintain mental balance</Text>
      </View>

      {/* Mood Entry Card */}
      <Card style={styles.entryCard}>
        <Text style={styles.cardTitle}>Log Your Feelings Right Now</Text>

        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreLarge, { color: getScoreColor(moodScore) }]}>{moodScore}</Text>
          <Text style={styles.scoreDesc}>{getScoreDescriptor(moodScore)}</Text>
        </View>

        {/* Rating Slider Selector */}
        <View style={styles.scoreRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => {
            const isSelected = moodScore === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.scoreButton, isSelected && styles.scoreButtonActive]}
                onPress={() => setMoodScore(s)}
              >
                <Text style={[styles.scoreText, isSelected && styles.scoreTextActive]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Emotion Tags */}
        <Text style={styles.fieldLabel}>Core Emotion:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
          {tags.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tagPill, selectedTag === t && styles.tagPillActive]}
              onPress={() => setSelectedTag(t)}
            >
              <Text style={[styles.tagText, selectedTag === t && styles.tagTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <InputField
          label="Optional Reflection Note"
          value={note}
          onChangeText={setNote}
          placeholder="What contributed to your feelings today?"
          multiline
          numberOfLines={2}
        />

        <Button
          title={submitting ? 'Saving...' : 'Save Mood Log'}
          onPress={handleSaveMood}
          loading={submitting}
          size="lg"
        />
      </Card>

      {/* History */}
      <Text style={styles.historyHeading}>Recent Mood Entries</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading history...</Text>
      ) : !Array.isArray(moodsHistory) || moodsHistory.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No mood check-ins recorded yet.</Text>
        </Card>
      ) : (
        moodsHistory.map((m, idx) => (
          <Card key={m.id || idx} style={styles.historyCard}>
            <View style={styles.historyRow}>
              <View style={[styles.historyScoreBox, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.historyScoreText, { color: getScoreColor(m.mood_score) }]}>
                  {m.mood_score}/10
                </Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyNote}>{m.note || 'General check-in'}</Text>
                <Text style={styles.historyDate}>
                  {m.logged_at ? new Date(m.logged_at).toLocaleDateString() : 'Today'}
                </Text>
              </View>
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
  entryCard: {
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
  scoreDisplay: {
    alignItems: 'center',
    marginVertical: 12,
  },
  scoreLarge: {
    fontSize: 54,
    fontWeight: '900',
  },
  scoreDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreButton: {
    width: 28,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scoreTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  tagScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tagTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  historyHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  historyCard: {
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyScoreBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScoreText: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyInfo: {
    flex: 1,
  },
  historyNote: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
