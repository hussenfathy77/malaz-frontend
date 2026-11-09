import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { communityService } from '../../services/communityService';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';

export const SafeCirclesScreen = ({ onBack }) => {
  const { user, role } = useAuth();
  const [circles, setCircles] = useState([]);
  const [activeCircle, setActiveCircle] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [joinedMap, setJoinedMap] = useState({});
  const flatListRef = useRef(null);
  const activeCircleIdRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Circle Creation State (for Admin / Doctor)
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDesc, setCircleDesc] = useState('');
  const [creatingCircle, setCreatingCircle] = useState(false);

  const canCreateCircle = role === 'ADMIN' || role === 'DOCTOR';

  const handleCreateCircle = async () => {
    if (!circleName.trim() || circleName.trim().length < 3) {
      Alert.alert('Validation Error', 'Circle name must be at least 3 characters.');
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
      Alert.alert('Success', 'Safe circle has been established successfully.');
      loadCircles();
    } catch (err) {
      Alert.alert('Creation Failed', err.message || 'Unable to create circle at this time.');
    } finally {
      setCreatingCircle(false);
    }
  };

  const loadCircles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityService.getCircles();
      const list = data || [];
      setCircles(list);

      const membership = {};
      list.forEach((c) => {
        if (c.my_membership) {
          membership[c.id] = c.my_membership.status || 'APPROVED';
        } else {
          const isMem =
            c.is_member === true ||
            c.isMember === true ||
            (Array.isArray(c.members) &&
              c.members.some((m) => {
                const mId = m?.user_id || m?.id || m?._id || m?.user?._id || m?.user;
                const uId = user?.id || user?._id;
                return mId && uId && String(mId) === String(uId);
              }));
          if (isMem) membership[c.id] = 'APPROVED';
        }
      });
      setJoinedMap((prev) => ({ ...prev, ...membership }));
    } catch (e) {
      console.warn('Failed to load circles', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  // Cleanup socket listeners when component unmounts
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (activeCircleIdRef.current) {
        socketService.leaveCircleRoom(activeCircleIdRef.current);
      }
    };
  }, []);

  const getMembershipStatus = (circle) => {
    const myMembership = circle.my_membership;
    if (myMembership) return myMembership.status || 'APPROVED';
    if (joinedMap[circle.id]) return joinedMap[circle.id];
    return null;
  };

  const isMemberOf = (circle) => {
    const status = getMembershipStatus(circle);
    return status === 'APPROVED' || status === true;
  };

  const isPendingApproval = (circle) => {
    return getMembershipStatus(circle) === 'PENDING';
  };

  const handleToggleJoin = async (circle) => {
    const memberStatus = getMembershipStatus(circle);
    try {
      if (memberStatus === 'APPROVED' || memberStatus === true) {
        await communityService.leaveCircle(circle.id);
        setJoinedMap((prev) => ({ ...prev, [circle.id]: null }));
      } else if (memberStatus === 'PENDING') {
        await communityService.leaveCircle(circle.id);
        setJoinedMap((prev) => ({ ...prev, [circle.id]: null }));
      } else {
        await communityService.joinCircle(circle.id);
        setJoinedMap((prev) => ({ ...prev, [circle.id]: 'PENDING' }));
        Alert.alert(
          'Request Sent',
          'Your join request has been sent. You will be able to chat once approved by the circle admin.'
        );
      }
      loadCircles();
    } catch (e) {
      if (
        e.message &&
        (e.message.toLowerCase().includes('already') || e.message.toLowerCase().includes('pending'))
      ) {
        setJoinedMap((prev) => ({ ...prev, [circle.id]: 'PENDING' }));
        loadCircles();
      } else {
        Alert.alert('Notice', e.message || 'Unable to update circle status.');
      }
    }
  };

  const handleOpenChat = async (circle) => {
    // Leave previous room if any
    if (activeCircleIdRef.current && activeCircleIdRef.current !== circle.id) {
      socketService.leaveCircleRoom(activeCircleIdRef.current);
      if (unsubscribeRef.current) unsubscribeRef.current();
    }

    setActiveCircle(circle);
    setMessages([]);
    setChatVisible(true);
    activeCircleIdRef.current = circle.id;

    // Load message history
    try {
      const msgs = await communityService.getMessages(circle.id);
      setMessages(msgs || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      setMessages([]);
    }

    // Connect Socket and join room for real-time updates
    try {
      await socketService.joinCircleRoom(circle.id);
      unsubscribeRef.current = socketService.onNewMessage((msg) => {
        // Only process messages for the active circle
        if (msg.circle_id === circle.id || msg.circle_id === activeCircleIdRef.current) {
          setMessages((prev) => {
            // Avoid duplicate if we already have this message (optimistic update)
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) {
              // Replace optimistic message with real one
              return prev.map((m) =>
                m.id === msg.id || (m.id?.toString().startsWith('tmp-') && m.content === msg.content)
                  ? msg
                  : m
              );
            }
            return [...prev, msg];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }
      });
    } catch (e) {
      console.warn('[Socket] Could not join circle room:', e.message);
    }
  };

  const handleCloseChat = () => {
    setChatVisible(false);
    if (activeCircleIdRef.current) {
      socketService.leaveCircleRoom(activeCircleIdRef.current);
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    activeCircleIdRef.current = null;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeCircle || sending) return;
    const content = newMessage.trim();
    const optimisticId = 'tmp-' + Date.now();
    const optimisticMsg = {
      id: optimisticId,
      content,
      circle_id: activeCircle.id,
      sender: { full_name: user?.full_name || 'Me', id: user?.id },
      isMine: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      await communityService.sendMessage(activeCircle.id, content);
      // The socket broadcast from server will update the message with real data
    } catch (e) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setNewMessage(content);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg) => {
    const senderId = msg.sender?.id || msg.sender_id;
    return String(senderId) === String(user?.id);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Safe Circles</Text>
              <Text style={styles.subtitle}>
                Supervised, peer-supported discussion communities for shared healing
              </Text>
            </View>
            {canCreateCircle && (
              <Button
                title="Create"
                size="sm"
                icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
                onPress={() => setCreateModalVisible(true)}
              />
            )}
          </View>
        </View>

        {/* Real-time indicator */}
        <View style={styles.realtimeBadge}>
          <View style={styles.realtimeDot} />
          <Text style={styles.realtimeText}>Live Chat</Text>
        </View>

        {/* Circles List */}
        {loading ? (
          <Text style={styles.loadingText}>Loading safe circles...</Text>
        ) : circles.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Circles Available</Text>
            <Text style={styles.emptyDesc}>
              Community groups will appear here once published by specialists.
            </Text>
          </Card>
        ) : (
          circles.map((c) => {
            const memberStatus = getMembershipStatus(c);
            const isMember = memberStatus === 'APPROVED' || memberStatus === true;
            const isPending = memberStatus === 'PENDING';
            return (
              <Card key={c.id} style={styles.circleCard}>
                <View style={styles.circleHeader}>
                  <Text style={styles.circleTitle}>{c.name}</Text>
                  <View style={styles.memberBadge}>
                    <Ionicons name="people-outline" size={13} color={colors.primary} />
                    <Text style={styles.memberText}>
                      {c._count?.members ?? c.members?.length ?? 1} members
                    </Text>
                  </View>
                </View>

                <Text style={styles.circleDesc}>{c.description}</Text>

                <View style={styles.circleFooter}>
                  {isPending ? (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time-outline" size={14} color="#D97706" />
                      <Text style={styles.pendingText}>Pending Approval</Text>
                    </View>
                  ) : (
                    <Button
                      title={isMember ? 'Leave Circle' : 'Join Circle'}
                      variant={isMember ? 'outline' : 'primary'}
                      size="sm"
                      onPress={() => handleToggleJoin(c)}
                    />
                  )}

                  {isMember && (
                    <Button
                      title="Open Chat"
                      size="sm"
                      icon={
                        <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FFFFFF" />
                      }
                      onPress={() => handleOpenChat(c)}
                    />
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Create Circle Modal (Admin / Doctor) */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Establish Safe Circle</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Circle Topic / Name *"
              value={circleName}
              onChangeText={setCircleName}
              placeholder="e.g. Anxiety & Mindfulness Circle"
            />

            <InputField
              label="Description / Purpose"
              value={circleDesc}
              onChangeText={setCircleDesc}
              placeholder="Describe the therapeutic focus and ground rules..."
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

      {/* Real-Time Group Chat Modal */}
      <Modal visible={chatVisible} animationType="slide">
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={handleCloseChat}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.chatHeaderTexts}>
              <Text style={styles.chatTitle}>{activeCircle?.name}</Text>
              <View style={styles.chatLiveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.chatSubtitle}>Live · Confidential</Text>
              </View>
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => (item.id ? String(item.id) : `msg-${idx}`)}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const mine = isMyMessage(item);
              const isOptimistic = String(item.id).startsWith('tmp-');
              return (
                <View
                  style={[
                    styles.msgWrapper,
                    mine ? styles.msgWrapperRight : styles.msgWrapperLeft,
                  ]}
                >
                  {!mine && (
                    <Text style={styles.msgSender}>
                      {item.sender?.full_name || 'Member'}
                    </Text>
                  )}
                  <View style={[styles.msgBubble, mine ? styles.msgBubbleMine : styles.msgBubbleOther]}>
                    <Text style={[styles.msgContent, mine && styles.msgContentMine]}>
                      {item.content}
                    </Text>
                  </View>
                  {mine && isOptimistic && (
                    <Text style={styles.msgSending}>Sending...</Text>
                  )}
                </View>
              );
            }}
          />

          <View style={styles.chatInputRow}>
            <InputField
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Share supportive thoughts..."
              style={styles.chatInput}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  realtimeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  realtimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
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
    marginTop: 20,
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
  circleCard: {
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  memberText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  circleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  circleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderTexts: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  chatLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  chatSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 10,
    gap: 10,
  },
  msgWrapper: {
    maxWidth: '80%',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
  },
  msgSender: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
    marginLeft: 4,
  },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
  },
  msgBubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  msgBubbleMine: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  msgContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  msgContentMine: {
    color: '#FFFFFF',
  },
  msgSending: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
    marginRight: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    marginBottom: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
