import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../api/axios';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let errs = {};
    if (!newPassword) { errs.newPassword = 'Password is required'; valid = false; }
    else if (newPassword.length < 6) { errs.newPassword = 'Password must be at least 6 characters'; valid = false; }
    
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    setErrors(errs);
    return valid;
  };

  const handleResetPassword = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/reset-password', { 
            email, 
            otp, 
            newPassword 
        });
        
        if (response.data.success) {
          Alert.alert('Success', 'Password reset successfully. You can now log in.');
          navigation.navigate('Login');
        } else {
          Alert.alert('Error', response.data.message);
        }
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0A0F1E', '#0D1B3E', '#1A1040']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="lock-open" size={36} color={COLORS.white} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>Your identity has been verified. Set a strong new password for your account.</Text>
            </View>

            <View style={styles.formCard}>
              <Input
                label="New Password"
                icon="lock-closed-outline"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                error={errors.newPassword}
                password
              />

              <Input
                label="Confirm Password"
                icon="checkmark-circle-outline"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                password
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                isLoading={isLoading}
                style={{ marginTop: 8 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.paddingXL,
    paddingTop: SIZES.paddingSmall,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    top: -80,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    bottom: 100,
    left: -100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 16,
    ...SHADOWS.glow,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.h1,
    fontFamily: FONTS.heading,
    color: COLORS.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.bodySmall,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.paddingLarge,
    ...SHADOWS.large,
  },
});

export default ResetPasswordScreen;
