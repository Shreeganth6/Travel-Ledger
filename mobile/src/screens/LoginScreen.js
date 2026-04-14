import React, { useState, useContext } from 'react';
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
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useContext(AuthContext);

  const validate = () => {
    let valid = true;
    let errs = {};
    if (!email) { errs.email = 'Email is required'; valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { errs.email = 'Invalid email'; valid = false; }
    if (!password) { errs.password = 'Password is required'; valid = false; }
    setErrors(errs);
    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try { await login(email, password); }
      catch (e) { Alert.alert('Login Failed', e); }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen dark gradient background */}
      <LinearGradient
        colors={['#0A0F1E', '#0D1B3E', '#1A1040']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orbs for depth */}
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
            {/* App Icon + Title */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="wallet" size={36} color={COLORS.white} />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>Navigo</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to manage your travel expenses</Text>
            </View>

            {/* Glass Form Card */}
            <View style={styles.formCard}>
              <Input
                label="Email Address"
                icon="mail-outline"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                password
              />

              <TouchableOpacity 
                onPress={() => navigation.navigate('ForgotPassword', { email })}
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
              >
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In"
                onPress={handleLogin}
                isLoading={isLoading}
                style={{ marginTop: 8 }}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.link}>Sign Up</Text>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.paddingXL,
    paddingTop: SIZES.paddingSmall,
  },
  // Decorative background orbs
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
  appName: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.semiBold,
    color: COLORS.primaryLight,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
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

export default LoginScreen;
