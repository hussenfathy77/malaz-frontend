import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { adminService } from '../../services/adminService';
import { communityService } from '../../services/communityService';

export const AdminHomeScreen = () => {
  const [activeTab, setActiveTab] = useState('DOCTORS'); // 'DOCTORS' | 'USERS' | 'CIRCLES'

  // Doctors State
  const [unverifiedDoctors, setUnverifiedDoctors] = useState([]);

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Circles State
  const [circles, setCircles] = useState([]);

  // Loading & Refresh
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'DOCTORS') {
        const docs = await adminService.getUnverifiedDoctors();
        setUnverifiedDoctors(docs || []);
      } else if (activeTab === 'USERS') {
        const res = await adminService.getUsers({ search: userSearch });
        setUsers(res || []);
      } else if (activeTab === 'CIRCLES') {
        const res = await communityService.getCircles();
        setCircles(res || []);
      }
    } catch (e) {
      console.warn('Failed to load admin data:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleVerifyDoctor = async (docId) => {
    try {
      await adminService.verifyDoctor(docId);
      Alert.alert('Practitioner Verified', 'The doctor credentials have been certified successfully.');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to verify doctor.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = nextStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate';

    Alert.alert(
      `${actionLabel} Account`,
      `Are you sure you want to set status to ${nextStatus} for ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: nextStatus === 'SUSPENDED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await adminService.updateUserStatus(user.id, nextStatus);
              Alert.alert('Status Updated', `User account is now ${nextStatus}.`);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update user status.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCircle = (circle) => {
    Alert.alert(
      'Delete Safe Circle',
      `Are you sure you want to permanently remove circle "${circle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteSafeCircle(circle.id);
              Alert.alert('Deleted', 'Safe circle has been removed.');
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete circle.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Administration Hub</Text>
        <Text style={styles.subtitle}>
          Supervise clinical licenses, platform user statuses, and community circles compliance
        </Text>
      </View>

      {/* KPI Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statVal}>{unverifiedDoctors.length}</Text>
          <Text style={styles.statLabel}>Pending Doctors</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: colors.primary }]}>{users.length || '30+'}</Text>
          <Text style={styles.statLabel}>Platform Accounts</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statVal, { color: colors.secondary }]}>Active</Text>
          <Text style={styles.statLabel}>API Health</Text>
        </Card>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DOCTORS' && styles.tabItemActive]}
          onPress={() => setActiveTab('DOCTORS')}
        >
          <Text style={[styles.tabText, activeTab === 'DOCTORS' && styles.tabTextActive]}>
            Doctor Approvals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'USERS' && styles.tabItemActive]}
          onPress={() => setActiveTab('USERS')}
        >
          <Text style={[styles.tabText, activeTab === 'USERS' && styles.tabTextActive]}>
            User Directory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'CIRCLES' && styles.tabItemActive]}
          onPress={() => setActiveTab('CIRCLES')}
        >
          <Text style={[styles.tabText, activeTab === 'CIRCLES' && styles.tabTextActive]}>
            Safe Circles
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: DOCTORS APPROVALS */}
      {activeTab === 'DOCTORS' && (
        <>
          <Text style={styles.sectionHeading}>Specialist Verification Queue</Text>
          {loading && unverifiedDoctors.length === 0 ? (
            <Text style={styles.loadingText}>Loading verification queue...</Text>
          ) : unverifiedDoctors.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
              <Text style={styles.emptyTitle}>Queue Clear</Text>
              <Text style={styles.emptyDesc}>All clinical practitioners have been certified.</Text>
            </Card>
          ) : (
            unverifiedDoctors.map((doc) => (
              <Card key={doc.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.itemTitle}>{doc.user?.full_name}</Text>
                    <Text style={styles.itemSubtitle}>{doc.specialization}</Text>
                    <Text style={styles.itemMeta}>{doc.user?.email}</Text>
                    <Text style={[styles.itemMeta, { marginTop: 4 }]}>
                      Rate: ${doc.session_price} / session
                    </Text>
                  </View>
                  <Badge status="UNVERIFIED" />
                </View>

                {doc.bio ? <Text style={styles.bioText}>{doc.bio}</Text> : null}

                {doc.certificate_url ? (
                  <TouchableOpacity
                    style={styles.certLink}
                    onPress={() => Linking.openURL(doc.certificate_url)}
                  >
                    <Ionicons name="document-text-outline" size={15} color={colors.primary} />
                    <Text style={styles.certLinkText}>View Certificate / License</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noCert}>No certificate uploaded yet</Text>
                )}

                <View style={styles.actionRow}>
                  <Button
                    title="Certify & Verify Doctor"
                    size="sm"
                    icon={<Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />}
                    onPress={() => handleVerifyDoctor(doc.id)}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))
          )}
        </>
      )}

      {/* TAB 2: USERS DIRECTORY */}
      {activeTab === 'USERS' && (
        <>
          <View style={styles.searchRow}>
            <InputField
              value={userSearch}
              onChangeText={(text) => {
                setUserSearch(text);
              }}
              placeholder="Search by name or email..."
              leftIcon={<Ionicons name="search" size={18} color={colors.textSecondary} />}
            />
            <Button
              title="Search"
              size="sm"
              onPress={loadData}
              style={{ marginBottom: 16 }}
            />
          </View>

          <Text style={styles.sectionHeading}>Registered Platform Users ({users.length})</Text>
          {loading && users.length === 0 ? (
            <Text style={styles.loadingText}>Loading users...</Text>
          ) : users.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyDesc}>No accounts match your search filter.</Text>
            </Card>
          ) : (
            users.map((u) => (
              <Card key={u.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.itemTitle}>{u.full_name}</Text>
                    <Text style={styles.itemSubtitle}>{u.email}</Text>
                    <Text style={styles.itemMeta}>Role: {u.role}</Text>
                  </View>
                  <Badge status={u.account_status || 'ACTIVE'} />
                </View>

                <View style={styles.actionRow}>
                  <Button
                    title={u.account_status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                    variant={u.account_status === 'ACTIVE' ? 'danger' : 'secondary'}
                    size="sm"
                    onPress={() => handleToggleUserStatus(u)}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))
          )}
        </>
      )}

      {/* TAB 3: SAFE CIRCLES */}
      {activeTab === 'CIRCLES' && (
        <>
          <Text style={styles.sectionHeading}>Active Community Circles ({circles.length})</Text>
          {loading && circles.length === 0 ? (
            <Text style={styles.loadingText}>Loading circles...</Text>
          ) : circles.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Safe Circles</Text>
              <Text style={styles.emptyDesc}>No community discussion circles have been created yet.</Text>
            </Card>
          ) : (
            circles.map((c) => (
              <Card key={c.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.itemTitle}>{c.name}</Text>
                    <Text style={styles.itemSubtitle}>{c.description || 'Support circle'}</Text>
                    <Text style={styles.itemMeta}>
                      Members: {Array.isArray(c.members) ? c.members.length : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Button
                    title="Remove Circle"
                    variant="ghost"
                    size="sm"
                    icon={<Ionicons name="trash-outline" size={16} color={colors.danger} />}
                    onPress={() => handleDeleteCircle(c)}
                    textStyle={{ color: colors.danger }}
                  />
                </View>
              </Card>
            ))
          )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    paddingVertical: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
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
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  bioText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  certLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.primaryMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  certLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  noCert: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  searchRow: {
    marginBottom: 6,
  },
});
