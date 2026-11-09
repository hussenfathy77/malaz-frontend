import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { communityService } from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';

export const DoctorSafeCirclesScreen = ({ onBack }) => {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create circle modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDesc, setCircleDesc] = useState('');
  const [creatingCircle, setCreatingCircle] = useState(false);

  // Manage members modal
  const [managingCircle, setManagingCircle] = useState(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadCircles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityService.getCircles();
      // Filter: only circles where the doctor is ADMIN
      const myCircles = (data || []).filter((c) => {
        const myMembership = c.my_membership;
        return myMembership && myMembership.role === 'ADMIN';
      });
      setCircles(myCircles);
    } catch (e) {
      console.warn('Failed to load doctor circles:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCircles();
    setRefreshing(false);
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim() || circleName.trim().length < 3) {
      Alert.alert('Validation', 'Circle name must be at least 3 characters.');
      return;
    }
    setCreatingCircle(true);
    try {
      await communityService.createCircle({
        name: circleName.trim(),
        description: circleDesc.trim() || undefined,
      });
      setCircleName('');
      setCircleDesc('');
      setCreateModalVisible(false);
      Alert.alert('Success', 'Safe circle created successfully.');
      loadCircles();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to create circle.');
    } finally {
      setCreatingCircle(false);
    }
  };

  const handleManageCircle = async (circle) => {
    setManagingCircle(circle);
    setManageModalVisible(true);
    setLoadingRequests(true);
    try {
      const requests = await communityService.getJoinRequests(circle.id);
      setJoinRequests(requests || []);
    } catch (e) {
      console.warn('Failed to fetch join requests:', e.message);
      setJoinRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (memberId) => {
    if (!managingCircle) return;
    setProcessingId(memberId);
    try {
      await communityService.approveMember(managingCircle.id, memberId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== memberId));
      Alert.alert('Approved', 'Member has been approved and can now join the chat.');
      loadCircles();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to approve member.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (memberId) => {
    if (!managingCircle) return;
    setProcessingId(memberId);
    try {
      await communityService.rejectMember(managingCircle.id, memberId);
      setJoinRequests((prev) => prev.filter((r) => r.id !== memberId));
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to reject member.');
    } finally {
      setProcessingId(null);
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
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Safe Circles</Text>
            <Text style={styles.subtitle}>Manage your therapeutic support communities and approve new members</Text>
          </View>
          <Button
            title="Create"
            size="sm"
            icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
            onPress={() => setCreateModalVisible(true)}
          />
        </View>
      </View>

      {/* Circles List */}
      {loading && circles.length === 0 ? (
        <Text style={styles.loadingText}>Loading your circles...</Text>
      ) : circles.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Circles Created Yet</Text>
          <Text style={styles.emptyDesc}>
            Create a safe circle to build a supervised therapeutic community for your patients.
          </Text>
          <Button
            title="Create First Circle"
            size="sm"
            style={{ marginTop: 14 }}
            onPress={() => setCreateModalVisible(true)}
          />
        </Card>
      ) : (
        circles.map((c) => (
          <Card key={c.id} style={styles.circleCard}>
            <View style={styles.circleHeader}>
              <Text style={styles.circleTitle}>{c.name}</Text>
              <View style={styles.memberBadge}>
                <Ionicons name="people-outline" size={13} color={colors.primary} />
                <Text style={styles.memberCount}>{c._count?.members ?? 1} members</Text>
              </View>
            </View>

            {c.description ? (
              <Text style={styles.circleDesc}>{c.description}</Text>
            ) : null}

            <View style={styles.circleFooter}>
              <Button
                title="Manage Members"
                size="sm"
                variant="outline"
                icon={<Ionicons name="settings-outline" size={14} color={colors.primary} />}
                onPress={() => handleManageCircle(c)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ))
      )}

      {/* Create Circle Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Safe Circle</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Circle Name *"
              value={circleName}
              onChangeText={setCircleName}
              placeholder="e.g. Anxiety & Mindfulness Support"
            />

            <InputField
              label="Description"
              value={circleDesc}
              onChangeText={setCircleDesc}
              placeholder="Describe the circle's purpose and guidelines..."
              multiline
              numberOfLines={3}
            />

            <Button
              title="Create Circle"
              onPress={handleCreateCircle}
              loading={creatingCircle}
              size="lg"
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* Manage Members Modal */}
      <Modal visible={manageModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.manageModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{managingCircle?.name}</Text>
                <Text style={styles.modalSub}>Pending Join Requests</Text>
              </View>
              <TouchableOpacity onPress={() => setManageModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingRequests ? (
              <Text style={styles.loadingText}>Loading requests...</Text>
            ) : joinRequests.length === 0 ? (
              <View style={styles.noRequestsBox}>
                <Ionicons name="checkmark-circle-outline" size={36} color={colors.primary} />
                <Text style={styles.noRequestsText}>No pending requests</Text>
                <Text style={styles.noRequestsDesc}>All join requests have been processed.</Text>
              </View>
            ) : (
              <FlatList
                data={joinRequests}
                keyExtractor={(item) => item.id}
                style={styles.requestsList}
                renderItem={({ item }) => (
                  <View style={styles.requestRow}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarChar}>
                        {item.user?.full_name ? item.user.full_name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{item.user?.full_name || 'Unknown User'}</Text>
                      <Text style={styles.requestEmail}>{item.user?.email || ''}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleApprove(item.id)}
                        disabled={processingId === item.id}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleReject(item.id)}
                        disabled={processingId === item.id}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            <Button
              title="Done"
              variant="outline"
              size="md"
              onPress={() => setManageModalVisible(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
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
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  loadingText: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 16 },
  emptyCard: { alignItems: 'center', padding: 26, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 10, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  circleCard: { padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  memberCount: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  circleDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  circleFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
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
  manageModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  noRequestsBox: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  noRequestsText: { fontSize: 15, fontWeight: '700', color: colors.text },
  noRequestsDesc: { fontSize: 12, color: colors.textSecondary },
  requestsList: { maxHeight: 300 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarChar: { fontSize: 16, fontWeight: '700', color: colors.primary },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '700', color: colors.text },
  requestEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: { backgroundColor: colors.primary },
  rejectBtn: { backgroundColor: colors.danger || '#EF4444' },
});
