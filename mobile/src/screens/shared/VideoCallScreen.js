import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

/**
 * VideoCallScreen
 *
 * - On Web: Opens the meeting_link in a new browser tab (most reliable cross-platform approach).
 * - On Mobile: Opens meeting_link via the device browser or native handler.
 *
 * The meeting_link is set by the doctor when confirming an appointment via
 * PATCH /appointments/:id/status  { status: 'CONFIRMED', meeting_link: '<url>' }
 *
 * Supported link formats:
 *  - Google Meet: https://meet.google.com/xxx-xxxx-xxx
 *  - Zoom:        https://zoom.us/j/xxxxxxxxx
 *  - Jitsi:       https://meet.jit.si/room-name
 *  - Custom:      https://meet.malaz.app/room-xxxx
 */
export const VideoCallScreen = ({ appointment, onBack }) => {
  const [connecting, setConnecting] = useState(false);

  const meetingLink = appointment?.meeting_link;
  const patientName =
    appointment?.patient?.user?.full_name ||
    appointment?.doctor?.user?.full_name ||
    'Participant';
  const appointmentDate = appointment?.date
    ? new Date(appointment.date).toLocaleDateString()
    : 'Scheduled';

  const handleJoinCall = async () => {
    if (!meetingLink) {
      Alert.alert(
        'No Meeting Link',
        'The doctor has not yet provided a video call link for this appointment.'
      );
      return;
    }

    setConnecting(true);

    if (Platform.OS === 'web') {
      // On web, open in a new tab
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
      setConnecting(false);
      return;
    }

    // On mobile, use Linking
    const supported = await Linking.canOpenURL(meetingLink);
    if (supported) {
      await Linking.openURL(meetingLink);
    } else {
      Alert.alert('Error', 'Cannot open meeting link. Please check the URL.');
    }
    setConnecting(false);
  };

  const getLinkProvider = (link) => {
    if (!link) return null;
    if (link.includes('meet.google.com')) return { name: 'Google Meet', icon: 'logo-google' };
    if (link.includes('zoom.us')) return { name: 'Zoom', icon: 'videocam' };
    if (link.includes('meet.jit.si')) return { name: 'Jitsi Meet', icon: 'people' };
    return { name: 'Video Session', icon: 'videocam-outline' };
  };

  const provider = getLinkProvider(meetingLink);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Telehealth Session</Text>
        <Text style={styles.subtitle}>Secure mental health consultation</Text>
      </View>

      {/* Session Info */}
      <Card style={styles.sessionCard}>
        <View style={styles.sessionIconWrap}>
          <Ionicons name="videocam" size={36} color={colors.primary} />
        </View>
        <Text style={styles.sessionTitle}>Video Consultation</Text>
        <Text style={styles.sessionDate}>{appointmentDate}</Text>
        <Text style={styles.sessionParticipant}>{patientName}</Text>
      </Card>

      {/* Meeting Link Display */}
      {meetingLink ? (
        <Card style={styles.linkCard}>
          <View style={styles.linkRow}>
            <View style={styles.linkIconWrap}>
              <Ionicons
                name={provider?.icon || 'videocam-outline'}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.linkTexts}>
              <Text style={styles.linkProvider}>{provider?.name}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>{meetingLink}</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.noLinkCard}>
          <Ionicons name="time-outline" size={28} color={colors.textMuted} />
          <Text style={styles.noLinkTitle}>Awaiting Link</Text>
          <Text style={styles.noLinkDesc}>
            The video call link will appear here once the doctor confirms and starts the session.
          </Text>
        </Card>
      )}

      {/* Instructions */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Before You Join</Text>
        {[
          'Ensure you have a stable internet connection',
          'Find a quiet, private space for your session',
          'Test your camera and microphone beforehand',
          'Keep your device charged or plugged in',
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </Card>

      {/* Join Button */}
      <Button
        title={connecting ? 'Connecting...' : 'Join Video Session'}
        onPress={handleJoinCall}
        loading={connecting}
        disabled={!meetingLink}
        size="lg"
        icon={<Ionicons name="videocam" size={18} color="#FFFFFF" />}
        style={styles.joinBtn}
      />

      {!meetingLink && (
        <Text style={styles.waitingText}>
          Waiting for doctor to activate the session link
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
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
  sessionCard: {
    alignItems: 'center',
    padding: 28,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sessionParticipant: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  linkCard: {
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTexts: {
    flex: 1,
  },
  linkProvider: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  linkUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noLinkCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  noLinkDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  infoCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  joinBtn: {
    marginBottom: 12,
  },
  waitingText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
  },
});
