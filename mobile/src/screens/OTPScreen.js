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

const OTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let errs = {};
    if (!otp) { errs.otp = 'OTP is required'; valid = false; }
    else if (otp.length !== 6) { errs.otp = 'OTP must be 6 digits'; valid = false; }
    setErrors(errs);
    return valid;
  };

  const handleVerifyOTP = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const response = await api.post('/auth/verify-otp', { email, otp });
        if (response.data.success) {
          Alert.alert('Success', 'OTP verified successfully');
          navigation.navigate('ResetPassword', { email, otp });
        } else {
          Alert.alert('Error', response.data.message);
        }
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Invalid or expired OTP');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    try {
        await api.post('/auth/forgot-password', { email });
        Alert.alert('Success', 'OTP resent to your email');
    } catch (error) {
        Alert.alert('Error', 'Failed to resend OTP');
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

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
                  <Ionicons name="keypad" size={36} color={COLORS.white} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
            </View>

            <View style={styles.formCard}>
              <Input
                label="Verification Code"
                icon="shield-checkmark-outline"
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                error={errors.otp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <Button
                title="Verify & Continue"
                onPress={handleVerifyOTP}
                isLoading={isLoading}
                style={{ marginTop: 8 }}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.link}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
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
  backButton: {
    marginLeft: SIZES.paddingLarge,
    marginTop: SIZES.paddingSmall,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SIZES.paddingLarge,
    paddingBottom: SIZES.paddingXL,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: SIZES.bodySmall,
  },
  link: {
    color: COLORS.primaryLight,
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.bodySmall,
  },
});

export default OTPScreen;
