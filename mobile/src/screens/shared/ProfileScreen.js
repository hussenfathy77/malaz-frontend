import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InputField } from '../../components/common/InputField';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { userService } from '../../services/userService';
import { uploadService } from '../../services/uploadService';

export const ProfileScreen = ({ onNavigate }) => {
  const { user, role, logout, updateUserData } = useAuth();

  // Modals state
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [securityVisible, setSecurityVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Edit Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [specialization, setSpecialization] = useState(
    user?.doctor_profile?.specialization || user?.specialization || ''
  );
  const [sessionPrice, setSessionPrice] = useState(
    user?.doctor_profile?.session_price?.toString() || user?.session_price?.toString() || '120'
  );
  const [bio, setBio] = useState(
    user?.doctor_profile?.bio || user?.bio || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState('');

  // Notification toggles state
  const [appointmentAlerts, setAppointmentAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(false);

  const isDoctor = role === 'DOCTOR';
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleChangeProfilePic = async () => {
    try {
      // Dynamic import to avoid errors if expo-image-picker not installed
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploadingPic(true);
      const url = await uploadService.uploadProfilePic(asset);
      if (url) {
        await updateUserData({ ...user, profile_pic: url });
        Alert.alert('Success', 'Profile picture updated successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  // Open Edit Profile modal
  const handleOpenEdit = () => {
    setFullName(user?.full_name || '');
    setSpecialization(user?.doctor_profile?.specialization || user?.specialization || '');
    setSessionPrice(user?.doctor_profile?.session_price?.toString() || user?.session_price?.toString() || '120');
    setBio(user?.doctor_profile?.bio || user?.bio || '');
    setEditProfileVisible(true);
  };

  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      // 1. Update general user profile on backend
      await userService.updateProfile({ full_name: fullName.trim() });

      const updatedUser = {
        ...user,
        full_name: fullName.trim(),
      };

      // 2. If Doctor, also update clinical doctor profile on backend
      if (isDoctor) {
        updatedUser.specialization = specialization.trim();
        updatedUser.session_price = parseFloat(sessionPrice) || 120;
        updatedUser.bio = bio.trim();
        updatedUser.doctor_profile = {
          ...(user?.doctor_profile || {}),
          specialization: specialization.trim(),
          session_price: parseFloat(sessionPrice) || 120,
          bio: bio.trim(),
        };

        await doctorService.updateDoctorProfile({
          full_name: fullName.trim(),
          specialization: specialization.trim(),
          session_price: parseFloat(sessionPrice) || 120,
          bio: bio.trim(),
        });
      }

      await updateUserData(updatedUser);
      setEditProfileVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password with real backend API
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      setSecurityMsg('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setSecurityMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg('Passwords do not match.');
      return;
    }
    setSecurityMsg('');
    setUpdatingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityVisible(false);
      Alert.alert('Success', 'Password has been updated securely.');
    } catch (err) {
      setSecurityMsg(err.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Delete account with confirmation
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account permanently? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  // Perform Log Out
  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Account & Practice Settings</Text>
      </View>

      {/* User Info Card */}
      <Card style={styles.userCard}>
        <View style={styles.userTop}>
          <TouchableOpacity onPress={handleChangeProfilePic} style={styles.avatarWrapper} disabled={uploadingPic}>
            {user?.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarChar}>
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name={uploadingPic ? 'hourglass-outline' : 'camera'} size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.userTexts}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.full_name || 'User Profile'}</Text>
              <Badge status={role} />
            </View>
            <Text style={styles.userEmail}>{user?.email || 'user@malaz.app'}</Text>

            {isDoctor && (
              <View style={styles.docSummaryBadge}>
                <Ionicons name="medical" size={14} color={colors.primary} />
                <Text style={styles.docSpecText}>
                  {user?.doctor_profile?.specialization || user?.specialization || 'Clinical Mental Health'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isDoctor && (
          <View style={styles.docExtraInfo}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Session Rate</Text>
              <Text style={styles.infoVal}>
                ${user?.doctor_profile?.session_price || user?.session_price || '120'} / 50m
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Verification</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>Certified</Text>
            </View>
          </View>
        )}

        <Button
          title={isDoctor ? 'Edit Doctor Profile' : 'Edit Personal Profile'}
          variant="outline"
          size="sm"
          icon={<Ionicons name="create-outline" size={16} color={colors.primary} />}
          onPress={handleOpenEdit}
          style={styles.editBtn}
        />
      </Card>

      {/* Doctor Schedule Shortcut */}
      {isDoctor && onNavigate && (
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleIconCircle}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.scheduleTexts}>
              <Text style={styles.scheduleTitle}>Availability & Schedule</Text>
              <Text style={styles.scheduleSubtitle}>Configure working hours and consultation days</Text>
            </View>
          </View>
          <Button
            title="Manage Schedule"
            size="sm"
            onPress={() => onNavigate('working-hours')}
            style={styles.scheduleBtn}
          />
        </Card>
      )}

      {/* Settings Menu Card */}
      <Text style={styles.sectionHeading}>Preferences & Security</Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={handleOpenEdit} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Personal Details</Text>
              <Text style={styles.menuItemSubtitle}>Name, clinical bio, rates</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setSecurityVisible(true)} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Privacy & Password</Text>
              <Text style={styles.menuItemSubtitle}>Update security credentials</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setNotificationsVisible(true)} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Notification Settings</Text>
              <Text style={styles.menuItemSubtitle}>Appointment alerts & emails</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => setHelpVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Help & Clinical Support</Text>
              <Text style={styles.menuItemSubtitle}>Support desk & telehealth guidelines</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Log Out Button */}
      <Button
        title="Log Out of Account"
        variant="danger"
        size="lg"
        onPress={() => setLogoutModalVisible(true)}
        icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
        style={styles.logoutBtn}
      />

      {/* Delete Account Button */}
      <TouchableOpacity
        style={styles.deleteAccountBtn}
        onPress={handleDeleteAccount}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteAccountText}>Delete Account Permanently</Text>
      </TouchableOpacity>

      {/* --- MODAL 1: Edit Profile Modal --- */}
      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isDoctor ? 'Edit Doctor Profile' : 'Edit Profile Details'}
              </Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField
                label="Full Name *"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Dr. Sarah Johnson"
                leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              />

              {isDoctor && (
                <>
                  <InputField
                    label="Specialization / Focus Area *"
                    value={specialization}
                    onChangeText={setSpecialization}
                    placeholder="e.g. Cognitive Behavioral Therapy, Anxiety"
                    leftIcon={<Ionicons name="medkit-outline" size={20} color={colors.textSecondary} />}
                  />

                  <InputField
                    label="Session Rate ($ / USD) *"
                    value={sessionPrice}
                    onChangeText={setSessionPrice}
                    placeholder="120"
                    keyboardType="numeric"
                    leftIcon={<Ionicons name="cash-outline" size={20} color={colors.textSecondary} />}
                  />

                  <InputField
                    label="Professional Bio & Philosophy"
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Provide context on your clinical experience and therapy techniques..."
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}

              <Button
                title={savingProfile ? 'Saving...' : 'Save Profile Changes'}
                onPress={handleSaveProfile}
                loading={savingProfile}
                size="lg"
                style={{ marginTop: 10, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: Security & Password Modal --- */}
      <Modal visible={securityVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setSecurityVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {securityMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{securityMsg}</Text>
              </View>
            ) : null}

            <InputField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <InputField
              label="New Password (min 6 chars)"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <InputField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Button
              title="Update Password"
              onPress={handleUpdatePassword}
              loading={updatingPassword}
              size="lg"
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: Notifications Settings Modal --- */}
      <Modal visible={notificationsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Consultation Reminders</Text>
                <Text style={styles.toggleSubtitle}>Push notifications 15m before video appointments</Text>
              </View>
              <Switch
                value={appointmentAlerts}
                onValueChange={setAppointmentAlerts}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Chat & Safe Circles Alerts</Text>
                <Text style={styles.toggleSubtitle}>Notifications when patients message or interact</Text>
              </View>
              <Switch
                value={messageAlerts}
                onValueChange={setMessageAlerts}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Weekly Practice Digest</Text>
                <Text style={styles.toggleSubtitle}>Summary of patient metrics sent to email</Text>
              </View>
              <Switch
                value={emailSummaries}
                onValueChange={setEmailSummaries}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <Button
              title="Done"
              onPress={() => setNotificationsVisible(false)}
              size="md"
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* --- MODAL 4: Help & Clinical Support Modal --- */}
      <Modal visible={helpVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clinical Support Desk</Text>
              <TouchableOpacity onPress={() => setHelpVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.supportCard}>
              <Ionicons name="mail" size={22} color={colors.primary} />
              <View style={styles.supportTexts}>
                <Text style={styles.supportLabel}>Support Email</Text>
                <Text style={styles.supportValue}>support@malaz.app</Text>
              </View>
            </View>

            <View style={styles.supportCard}>
              <Ionicons name="call" size={22} color={colors.secondary} />
              <View style={styles.supportTexts}>
                <Text style={styles.supportLabel}>Telehealth Emergency Helpline</Text>
                <Text style={styles.supportValue}>+1 (800) 555-MALAZ</Text>
              </View>
            </View>

            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            <Text style={styles.faqText}>
              • How do video links connect? Automatic WebRTC encrypted rooms are created upon payment confirmation.
            </Text>
            <Text style={styles.faqText}>
              • When are clinical notes saved? Directly to the client's electronic health record post-session.
            </Text>

            <Button
              title="Close"
              variant="outline"
              onPress={() => setHelpVisible(false)}
              size="md"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* --- MODAL 5: Reliable In-App Log Out Confirmation Modal --- */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalBoxCenter}>
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={32} color={colors.danger} />
            </View>

            <Text style={styles.logoutModalTitle}>Log Out</Text>
            <Text style={styles.logoutModalDesc}>
              Are you sure you want to log out of your Malaz account?
            </Text>

            <View style={styles.logoutActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setLogoutModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Log Out"
                variant="danger"
                size="md"
                onPress={handleConfirmLogout}
                style={{ flex: 1 }}
              />
            </View>
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  userCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarChar: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userTexts: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  docSummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  docSpecText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  docExtraInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  editBtn: {
    marginTop: 16,
  },
  scheduleCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scheduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTexts: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scheduleBtn: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  menuCard: {
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceElevated,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  supportTexts: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  supportValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  faqText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBoxCenter: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  logoutModalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
  },
  logoutActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
});
