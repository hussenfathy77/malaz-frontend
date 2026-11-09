import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { authService } from '../../services/authService';

export const ForgotPasswordScreen = ({ onNavigateToLogin }) => {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter reset token and new password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestToken = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await authService.forgotPassword(email.trim().toLowerCase());
    setLoading(false);
    if (res.success) {
      setMessage('Password reset token sent to your email.');
      if (res.resetToken) setToken(res.resetToken);
      setStep(2);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || newPassword.length < 6) {
      setErrorMsg('Please enter the reset token and a new password (min 6 chars).');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await authService.resetPassword(token.trim(), newPassword);
    setLoading(false);
    if (res.success) {
      setMessage('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onNavigateToLogin}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Enter your registered email and we will send you a reset code'
            : 'Enter the reset code and your new password'}
        </Text>
      </View>

      <Card style={styles.card}>
        {message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />
            <Button
              title="Send Reset Code"
              onPress={handleRequestToken}
              loading={loading}
              size="lg"
            />
          </>
        ) : (
          <>
            <InputField
              label="Reset Token"
              value={token}
              onChangeText={setToken}
              placeholder="Paste token here"
              leftIcon={<Ionicons name="shield-outline" size={20} color={colors.textSecondary} />}
            />
            <InputField
              label="New Password (min 6 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />
            <Button
              title="Update Password"
              onPress={handleResetPassword}
              loading={loading}
              size="lg"
            />
          </>
        )}
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
    padding: 24,
    paddingTop: 48,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  card: {
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
  },
});
