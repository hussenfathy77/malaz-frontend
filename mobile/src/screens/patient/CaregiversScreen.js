import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { caregiverService } from '../../services/caregiverService';

export const CaregiversScreen = ({ onBack }) => {
  const [caregivers, setCaregivers] = useState([]);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [consentScope, setConsentScope] = useState('Mood & Appointments Tracking');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  const scopes = [
    'Mood & Appointments Tracking',
    'Emergency Alerts Only',
    'Full Access (Moods, Consultations & Care Plan)',
  ];

  const loadCaregivers = async () => {
    setLoading(true);
    try {
      const data = await caregiverService.getMyCaregivers();
      setCaregivers(data || []);
    } catch (e) {
      console.warn('Failed to load caregivers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregivers();
  }, []);

  const handleSendInvite = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setInviting(true);
    try {
      await caregiverService.inviteCaregiver({ email: email.trim().toLowerCase(), consent_scope: consentScope });
      setEmail('');
      setInviteModalVisible(false);
      Alert.alert('Invitation Sent', 'Caregiver authorization invite has been dispatched.');
      loadCaregivers();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to invite caregiver.');
    } finally {
      setInviting(false);
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
        <View style={styles.headerRow}>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Caregivers & Support</Text>
            <Text style={styles.subtitle}>
              Grant trusted family or support persons permission to review your wellness logs
            </Text>
          </View>
          <Button
            title="Invite"
            size="sm"
            icon={<Ionicons name="person-add-outline" size={15} color="#FFFFFF" />}
            onPress={() => setInviteModalVisible(true)}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading authorized caregivers...</Text>
      ) : caregivers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="heart-outline" size={38} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Caregivers Linked</Text>
          <Text style={styles.emptyDesc}>Invite a family member or companion to help support your health journey.</Text>
        </Card>
      ) : (
        caregivers.map((cg) => (
          <Card key={cg.id} style={styles.cgCard}>
            <View style={styles.cgTop}>
              <View style={styles.cgAvatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.cgInfo}>
                <Text style={styles.cgName}>{cg.caregiver?.full_name || cg.caregiver?.email}</Text>
                <Text style={styles.cgScope}>{cg.consent_scope}</Text>
              </View>
              <Badge status={cg.status} />
            </View>
          </Card>
        ))
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Trusted Caregiver</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Caregiver Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="companion@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />

            <Text style={styles.scopeLabel}>Authorized Sharing Scope:</Text>
            <View style={styles.scopeList}>
              {scopes.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.scopeItem, consentScope === s && styles.scopeItemActive]}
                  onPress={() => setConsentScope(s)}
                >
                  <Ionicons
                    name={consentScope === s ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={consentScope === s ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.scopeText, consentScope === s && styles.scopeTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Send Authorization Invite"
              onPress={handleSendInvite}
              loading={inviting}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTexts: {
    flex: 1,
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
    color: colors.textSecondary,
    textAlign: 'center',
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
  cgCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cgTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cgInfo: {
    flex: 1,
  },
  cgName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cgScope: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  scopeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  scopeList: {
    gap: 10,
    marginBottom: 20,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeItemActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  scopeText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  scopeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
