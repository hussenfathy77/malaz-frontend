import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { notificationService } from '../../services/notificationService';

export const NotificationsScreen = ({ onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifs();
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleMarkAll}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading notifications...</Text>
      ) : notifications.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={38} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>All Caught Up</Text>
          <Text style={styles.emptyDesc}>You have no unread notifications or clinical alerts.</Text>
        </Card>
      ) : (
        notifications.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => handleMarkOne(n.id)} activeOpacity={0.8}>
            <Card style={[styles.notifCard, !n.is_read && styles.notifUnread]}>
              <View style={styles.notifHeader}>
                <View style={styles.dotRow}>
                  {!n.is_read && <View style={styles.unreadDot} />}
                  <Text style={styles.notifContent}>{n.content}</Text>
                </View>
                <Text style={styles.notifDate}>
                  {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  markAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
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
  },
  notifCard: {
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifUnread: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  notifContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  notifDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
