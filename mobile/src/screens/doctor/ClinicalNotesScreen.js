import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { clinicalNotesService } from '../../services/clinicalNotesService';

export const ClinicalNotesScreen = ({ onBack }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const data = await clinicalNotesService.getNotes();
        setNotes(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Clinical Documentation</Text>
        <Text style={styles.subtitle}>Patient diagnostic impressions, treatment plans, and post-session charting</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading clinical records...</Text>
      ) : notes.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Notes Documented</Text>
          <Text style={styles.emptyDesc}>Clinical notes logged after patient sessions will be safely archived here.</Text>
        </Card>
      ) : (
        notes.map((n) => (
          <Card key={n.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Ionicons name="medical-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagTitle}>{n.diagnosis}</Text>
                  {n.patient?.user?.full_name && (
                    <Text style={styles.patientNameSub}>Patient: {n.patient.user.full_name}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.dateText}>
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
              </Text>
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Prescribed Treatment Plan:</Text>
              <Text style={styles.sectionBody}>{n.treatment_plan}</Text>
            </View>

            {n.notes && (
              <View style={[styles.sectionBox, styles.notesBox]}>
                <Text style={styles.sectionLabel}>Confidential Observations:</Text>
                <Text style={styles.sectionBody}>{n.notes}</Text>
              </View>
            )}
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
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  diagTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  patientNameSub: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionBox: {
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
