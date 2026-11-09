import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { notificationService } from './src/services/notificationService';

// Components
import { Header } from './src/components/common/Header';
import { BottomBar } from './src/components/common/BottomBar';

// Auth Screens
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';

// Patient Screens
import { PatientHomeScreen } from './src/screens/patient/PatientHomeScreen';
import { MoodTrackerScreen } from './src/screens/patient/MoodTrackerScreen';
import { JournalScreen } from './src/screens/patient/JournalScreen';
import { DoctorsScreen } from './src/screens/patient/DoctorsScreen';
import { PatientAppointmentsScreen } from './src/screens/patient/PatientAppointmentsScreen';
import { SafeCirclesScreen } from './src/screens/patient/SafeCirclesScreen';
import { CaregiversScreen } from './src/screens/patient/CaregiversScreen';
import { NearbyDoctorsScreen } from './src/screens/patient/NearbyDoctorsScreen';

// Doctor Screens
import { DoctorHomeScreen } from './src/screens/doctor/DoctorHomeScreen';
import { WorkingHoursScreen } from './src/screens/doctor/WorkingHoursScreen';
import { DoctorAppointmentsScreen } from './src/screens/doctor/DoctorAppointmentsScreen';
import { ClinicalNotesScreen } from './src/screens/doctor/ClinicalNotesScreen';
import { DoctorPatientsScreen } from './src/screens/doctor/DoctorPatientsScreen';
import { DoctorSafeCirclesScreen } from './src/screens/doctor/DoctorSafeCirclesScreen';

// Caregiver Screens
import { CaregiverHomeScreen } from './src/screens/caregiver/CaregiverHomeScreen';

// Admin Screens
import { AdminHomeScreen } from './src/screens/admin/AdminHomeScreen';

// Shared Screens
import { NotificationsScreen } from './src/screens/shared/NotificationsScreen';
import { ProfileScreen } from './src/screens/shared/ProfileScreen';
import { VideoCallScreen } from './src/screens/shared/VideoCallScreen';

function MainNavigator() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState('welcome'); // 'welcome' | 'login' | 'register' | 'forgot'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getNotifications().then((notifs) => {
        if (Array.isArray(notifs)) {
          const unread = notifs.filter((n) => !n.is_read).length;
          setUnreadNotifs(unread);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, currentScreen]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Handle Unauthenticated State
  if (!isAuthenticated) {
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onGetStarted={() => setAuthScreen('login')}
          onSignIn={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onNavigateToLogin={() => setAuthScreen('login')}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginScreen
        onNavigateToRegister={() => setAuthScreen('register')}
        onNavigateToForgot={() => setAuthScreen('forgot')}
        onBack={() => setAuthScreen('welcome')}
      />
    );
  }

  // Render Role-Tailored Screen
  const renderScreen = () => {
    // Shared Screens
    if (currentScreen === 'notifications') {
      return <NotificationsScreen onBack={() => setCurrentScreen('home')} />;
    }
    if (currentScreen === 'profile') {
      return <ProfileScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
    }
    if (currentScreen === 'circles') {
      return <SafeCirclesScreen onBack={() => setCurrentScreen('home')} />;
    }
    if (currentScreen === 'video-call') {
      return (
        <VideoCallScreen
          appointment={activeAppointment}
          onBack={() => {
            setActiveAppointment(null);
            setCurrentScreen('home');
          }}
        />
      );
    }

    // Role: PATIENT
    if (role === 'PATIENT') {
      switch (currentScreen) {
        case 'moods':
          return <MoodTrackerScreen onBack={() => setCurrentScreen('home')} />;
        case 'journals':
          return <JournalScreen onBack={() => setCurrentScreen('home')} />;
        case 'doctors':
          return (
            <DoctorsScreen
              onBack={() => setCurrentScreen('home')}
              onNavigateToAppointments={() => setCurrentScreen('appointments')}
            />
          );
        case 'appointments':
          return <PatientAppointmentsScreen onBack={() => setCurrentScreen('home')} onJoinCall={(apt) => { setActiveAppointment(apt); setCurrentScreen('video-call'); }} />;
        case 'caregivers':
          return <CaregiversScreen onBack={() => setCurrentScreen('home')} />;
        case 'nearby-doctors':
          return (
            <NearbyDoctorsScreen
              onBack={() => setCurrentScreen('home')}
              onBookDoctor={() => setCurrentScreen('doctors')}
            />
          );
        case 'home':
        default:
          return <PatientHomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
      }
    }

    // Role: DOCTOR
    if (role === 'DOCTOR') {
      switch (currentScreen) {
        case 'working-hours':
          return <WorkingHoursScreen onBack={() => setCurrentScreen('home')} />;
        case 'doctor-appointments':
          return <DoctorAppointmentsScreen onBack={() => setCurrentScreen('home')} onJoinCall={(apt) => { setActiveAppointment(apt); setCurrentScreen('video-call'); }} />;
        case 'clinical-notes':
          return <ClinicalNotesScreen onBack={() => setCurrentScreen('home')} />;
        case 'doctor-patients':
          return <DoctorPatientsScreen onBack={() => setCurrentScreen('home')} />;
        case 'doctor-circles':
          return <DoctorSafeCirclesScreen onBack={() => setCurrentScreen('home')} />;
        case 'home':
        default:
          return <DoctorHomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
      }
    }

    // Role: CAREGIVER
    if (role === 'CAREGIVER') {
      switch (currentScreen) {
        case 'home':
        default:
          return <CaregiverHomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
      }
    }

    // Role: ADMIN
    if (role === 'ADMIN') {
      switch (currentScreen) {
        case 'home':
        default:
          return <AdminHomeScreen />;
      }
    }

    return <PatientHomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Main Header with Notifications and Avatar */}
      <Header
        unreadCount={unreadNotifs}
        onNotificationPress={() => setCurrentScreen('notifications')}
      />

      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Role-Specific Bottom Navigation Bar */}
      <BottomBar currentScreen={currentScreen} onNavigate={(tab) => setCurrentScreen(tab)} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
