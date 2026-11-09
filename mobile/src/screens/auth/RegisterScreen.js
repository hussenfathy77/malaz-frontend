import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { useAuth } from '../../context/AuthContext';
import { uploadService } from '../../services/uploadService';

export const RegisterScreen = ({ onNavigateToLogin, onBack }) => {
  const { register } = useAuth();

  // Selected Role
  const [selectedRole, setSelectedRole] = useState('PATIENT'); // 'PATIENT' | 'DOCTOR' | 'CAREGIVER'

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Patient Fields
  const [dob, setDob] = useState('2000-01-01');
  const [gender, setGender] = useState('Female'); // 'Female' | 'Male'
  const [emergencyContact, setEmergencyContact] = useState('');

  // Doctor Fields
  const [specialization, setSpecialization] = useState('');
  const [sessionPrice, setSessionPrice] = useState('300');
  const [bio, setBio] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickCertificate = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      setCertificateFile(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const handleRegister = async () => {
    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: selectedRole,
    };

    if (selectedRole === 'PATIENT') {
      payload.date_of_birth = dob ? new Date(dob).toISOString() : undefined;
      payload.gender = gender;
      payload.emergency_contact = emergencyContact;
    } else if (selectedRole === 'DOCTOR') {
      if (!specialization.trim()) {
        setErrorMsg('Specialization is required for healthcare professionals.');
        return;
      }
      if (!sessionPrice || isNaN(Number(sessionPrice))) {
        setErrorMsg('Please enter a valid session price.');
        return;
      }
      payload.specialization = specialization.trim();
      payload.session_price = parseFloat(sessionPrice);
      payload.bio = bio.trim();
    }

    setErrorMsg('');
    setLoading(true);
    const res = await register(payload);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed. Please try again.');
    } else if (selectedRole === 'DOCTOR' && certificateFile) {
      // Upload certificate after successful registration (non-blocking)
      try {
        await uploadService.uploadCertificate(certificateFile);
      } catch (err) {
        console.warn('Certificate upload failed:', err.message);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
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

      {/* Nature Banner */}
      <View style={styles.bannerWrap}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop',
          }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.privatePill}>
          <Text style={styles.privatePillText}>JOIN OUR CARE CIRCLE</Text>
        </View>
        <View style={styles.glassBanner}>
          <View style={styles.glassIndicator} />
          <View style={styles.glassTexts}>
            <Text style={styles.glassTag}>SAFE SANCTUARY</Text>
            <Text style={styles.glassHeading}>Find your dedicated path to healing.</Text>
          </View>
        </View>
      </View>

      {/* Card Container */}
      <Card style={styles.authCard}>
        {/* Segmented Switcher */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity style={styles.segmentBtn} onPress={onNavigateToLogin} activeOpacity={0.8}>
            <Text style={styles.segmentText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive]} activeOpacity={0.9}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Role Picker Tabs */}
        <Text style={styles.rolePickerLabel}>SELECT YOUR ROLE</Text>
        <View style={styles.roleTabs}>
          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'PATIENT' && styles.roleTabActive]}
            onPress={() => setSelectedRole('PATIENT')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleTabIcon}>🧑</Text>
            <Text style={[styles.roleTabText, selectedRole === 'PATIENT' && styles.roleTabTextActive]}>
              Patient
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'DOCTOR' && styles.roleTabActive]}
            onPress={() => setSelectedRole('DOCTOR')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleTabIcon}>🩺</Text>
            <Text style={[styles.roleTabText, selectedRole === 'DOCTOR' && styles.roleTabTextActive]}>
              Doctor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, selectedRole === 'CAREGIVER' && styles.roleTabActive]}
            onPress={() => setSelectedRole('CAREGIVER')}
            activeOpacity={0.8}
          >
            <Text style={styles.roleTabIcon}>🤝</Text>
            <Text style={[styles.roleTabText, selectedRole === 'CAREGIVER' && styles.roleTabTextActive]}>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Notification */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <InputField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Sarah Johnson"
        />

        <InputField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          label="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
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

        {/* Patient Specific */}
        {selectedRole === 'PATIENT' && (
          <>
            <InputField
              label="Date of birth (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
              placeholder="2000-01-01"
            />

            <View style={styles.genderRow}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderBtns}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                  onPress={() => setGender('Female')}
                >
                  <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                  onPress={() => setGender('Male')}
                >
                  <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <InputField
              label="Emergency contact phone"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="+1 555 123 4567"
              keyboardType="phone-pad"
            />
          </>
        )}

        {/* Doctor Specific */}
        {selectedRole === 'DOCTOR' && (
          <>
            <InputField
              label="Specialization"
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="e.g. Clinical Psychology, Cognitive Therapy"
            />

            <InputField
              label="Session price (USD)"
              value={sessionPrice}
              onChangeText={setSessionPrice}
              placeholder="150"
              keyboardType="numeric"
            />

            <InputField
              label="Professional Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell patients about your clinical focus and background..."
              multiline
              numberOfLines={3}
            />

            {/* Certificate Upload */}
            <View style={styles.certSection}>
              <Text style={styles.fieldLabel}>Medical License / Certificate *</Text>
              <TouchableOpacity style={styles.certUploadBtn} onPress={handlePickCertificate} activeOpacity={0.8}>
                <Ionicons
                  name={certificateFile ? 'document-attach' : 'cloud-upload-outline'}
                  size={22}
                  color={certificateFile ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.certUploadText, certificateFile && { color: colors.primary }]}>
                  {certificateFile ? certificateFile.name : 'Upload PDF or Image (max 5 MB)'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.certNote}>
                Your certificate will be reviewed by our admin team before your profile is visible to patients.
              </Text>
            </View>
          </>
        )}

        {/* Caregiver Specific */}
        {selectedRole === 'CAREGIVER' && (
          <View style={styles.caregiverNotice}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.caregiverNoticeText}>
              Caregivers can monitor authorized patients with full therapeutic transparency once linked.
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={`Register as ${selectedRole === 'PATIENT' ? 'Patient' : selectedRole === 'DOCTOR' ? 'Doctor' : 'Caregiver'}`}
          onPress={handleRegister}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

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
    height: 160,
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
    marginBottom: 18,
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
  rolePickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  roleTab: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleTabActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  roleTabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  roleTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
  genderRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  genderBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  caregiverNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryMuted,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  caregiverNoticeText: {
    fontSize: 12,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  securityNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  certSection: {
    marginBottom: 16,
  },
  certUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    marginTop: 6,
  },
  certUploadText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  certNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
