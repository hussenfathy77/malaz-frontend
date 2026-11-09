import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ onNavigateToRegister, onNavigateToForgot, onBack }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header with Brand */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="heart" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>malaz</Text>
        </View>

        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Scenic Nature Banner Card */}
      <View style={styles.bannerWrap}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop',
          }}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Top-Left Pill Badge */}
        <View style={styles.privatePill}>
          <Text style={styles.privatePillText}>PRIVATE BY DESIGN</Text>
        </View>

        {/* Bottom Floating Glassmorphic Tag */}
        <View style={styles.glassBanner}>
          <View style={styles.glassIndicator} />
          <View style={styles.glassTexts}>
            <Text style={styles.glassTag}>YOUR SAFE SPACE</Text>
            <Text style={styles.glassHeading}>Care begins with feeling seen.</Text>
          </View>
        </View>
      </View>

      {/* Main Authentication Card */}
      <Card style={styles.authCard}>
        {/* Segmented Tab Switcher */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive]} activeOpacity={0.9}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.segmentBtn} onPress={onNavigateToRegister} activeOpacity={0.8}>
            <Text style={styles.segmentText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <Text style={styles.welcomeTag}>WELCOME BACK</Text>
        <Text style={styles.welcomeHeading}>Welcome back to Malaz</Text>
        <Text style={styles.welcomeSubtitle}>
          Enter your details and we'll open the right space for your account.
        </Text>

        {/* Error Notification */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <InputField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry={secureText}
          autoCapitalize="none"
          rightIcon={
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons
                name={secureText ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        {/* Forgot Password Link */}
        <TouchableOpacity onPress={onNavigateToForgot} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <Button
          title="Sign in securely"
          onPress={handleLogin}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

        {/* Security Footnote */}
        <Text style={styles.securityNote}>
          Your role and permissions are verified securely by the server.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerWrap: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  privatePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  privatePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.7,
  },
  glassBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  glassIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
  },
  glassTexts: {
    flex: 1,
  },
  glassTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  glassHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
  authCard: {
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF3F1',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  welcomeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  welcomeHeading: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -2,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  securityNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
