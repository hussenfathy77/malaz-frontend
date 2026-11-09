import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { useAuth } from '../../context/AuthContext';
import { toolkitService } from '../../services/toolkitService';

export const JournalScreen = ({ onBack }) => {
  const { role } = useAuth();
  const [content, setContent] = useState('');
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadJournals = async () => {
    setLoading(true);
    try {
      const data = await toolkitService.getJournals();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.history)
        ? data.history
        : Array.isArray(data?.journals)
        ? data.journals
        : [];
      setJournals(list);
    } catch (e) {
      console.warn('Failed to fetch journals', e);
      setJournals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, []);

  const handleSaveJournal = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const newEntry = await toolkitService.addJournal({ content: content.trim() });
      setContent('');
      if (newEntry && newEntry.id) {
        setJournals((prev) => [newEntry, ...(Array.isArray(prev) ? prev : [])]);
      }
      await loadJournals();
    } catch (err) {
      console.warn('Error saving journal:', err.message);
      Alert.alert('Notice', 'Could not save journal entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Recent';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString();
    } catch {
      return 'Recent';
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
        <Text style={styles.title}>Reflective Journal</Text>
        <Text style={styles.subtitle}>A private, safe space to untangle your thoughts and cultivate clarity</Text>
      </View>

      {/* Role Restriction Banner if not patient */}
      {role && role !== 'PATIENT' && (
        <Card style={styles.roleWarningCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.roleWarningText}>
            Personal journaling is reserved for patient profiles.
          </Text>
        </Card>
      )}

      {/* New Entry Box */}
      <Card style={styles.writeCard}>
        <View style={styles.promptHeader}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.promptTitle}>What's on your mind today?</Text>
        </View>

        <InputField
          value={content}
          onChangeText={setContent}
          placeholder="Reflect on your day, challenges, gratitude, or moments of peace..."
          multiline
          numberOfLines={5}
          inputStyle={styles.journalInput}
        />

        <Button
          title={submitting ? 'Saving Entry...' : 'Save Journal Entry'}
          onPress={handleSaveJournal}
          loading={submitting}
          size="md"
          variant="primary"
          icon={<Ionicons name="send" size={16} color="#FFFFFF" />}
        />
      </Card>

      {/* Past Entries */}
      <Text style={styles.entriesHeading}>Past Journal Logs</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading entries...</Text>
      ) : !Array.isArray(journals) || journals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="book-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Entries Recorded</Text>
          <Text style={styles.emptyDesc}>Start writing to build your mindful personal reflection archive.</Text>
        </Card>
      ) : (
        journals.map((j, idx) => (
          <Card key={j.id || idx} style={styles.entryItemCard}>
            <View style={styles.entryHeader}>
              <View style={styles.dateTag}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={styles.dateText}>{formatDate(j.created_at)}</Text>
              </View>
            </View>

            <Text style={styles.entryBody}>{j.content || ''}</Text>

            {j.ai_feedback ? (
              <View style={styles.feedbackBox}>
                <View style={styles.feedbackTitleRow}>
                  <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                  <Text style={styles.feedbackTitle}>Clinical & Mindful Insight</Text>
                </View>
                <Text style={styles.feedbackText}>{j.ai_feedback}</Text>
              </View>
            ) : null}
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
  writeCard: {
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  journalInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  entriesHeading: {
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  entryItemCard: {
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  entryBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  feedbackBox: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  feedbackText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  roleWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    marginBottom: 16,
  },
  roleWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
});
