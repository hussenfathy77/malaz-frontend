import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export const WelcomeScreen = ({ onGetStarted, onSignIn }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="heart" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>malaz</Text>
        </View>

        <TouchableOpacity style={styles.topSignInBtn} onPress={onSignIn} activeOpacity={0.8}>
          <Text style={styles.topSignInText}>Sign in</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Badge Tag */}
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={13} color={colors.primary} />
          <Text style={styles.badgeText}>CARE THAT FEELS HUMAN</Text>
        </View>
      </View>

      {/* Main Headline */}
      <Text style={styles.heroTitleMain}>Your Safe Haven for</Text>
      <Text style={styles.heroTitleItalic}>Mental Wellness</Text>

      {/* Subtitle / Value Proposition */}
      <Text style={styles.heroSubtitle}>
        A compassionate, private place to understand yourself, connect with trusted professionals, and feel supported through every chapter.
      </Text>

      {/* Primary CTA Button */}
      <TouchableOpacity style={styles.ctaButton} onPress={onGetStarted} activeOpacity={0.85}>
        <Text style={styles.ctaButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Trust Notice */}
      <View style={styles.trustRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.trustText}>Private by design. Always.</Text>
      </View>

      {/* Metrics / Social Proof */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Average care rating</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>10k+</Text>
          <Text style={styles.statLabel}>Supported members</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Confidential</Text>
        </View>
      </View>

      {/* Arched Hero Graphic Section */}
      <View style={styles.archContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
          }}
          style={styles.archImage}
          resizeMode="cover"
        />

        {/* Floating Card 1: Daily Check-in (Top Right) */}
        <View style={styles.checkinCard}>
          <Text style={styles.checkinTag}>DAILY CHECK-IN</Text>
          <Text style={styles.checkinMood}>You're feeling calm</Text>
          <View style={styles.checkinProgressRow}>
            <Text style={styles.checkinEmoji}>😌</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        </View>

        {/* Floating Card 2: Next Session with Doctor (Bottom Left) */}
        <View style={styles.sessionCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop',
            }}
            style={styles.doctorAvatar}
          />
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTag}>NEXT SESSION</Text>
            <Text style={styles.sessionDoctor}>Dr. Nora Hale</Text>
            <Text style={styles.sessionTime}>Tomorrow • 10:30 AM</Text>
          </View>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  topSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topSignInText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryMuted,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  heroTitleMain: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  heroTitleItalic: {
    fontSize: 38,
    fontStyle: 'italic',
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  trustText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  archContainer: {
    width: width - 44,
    height: 380,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  archImage: {
    width: '100%',
    height: '100%',
  },
  checkinCard: {
    position: 'absolute',
    top: 50,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 145,
  },
  checkinTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  checkinMood: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  checkinProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkinEmoji: {
    fontSize: 18,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5EFEA',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sessionCard: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  sessionDoctor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sessionTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
