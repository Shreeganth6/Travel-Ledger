import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useContext(AuthContext);

  const validate = () => {
    let valid = true;
    let errs = {};
    if (!fullName) { errs.fullName = 'Full Name is required'; valid = false; }
    if (!email) { errs.email = 'Email is required'; valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { errs.email = 'Invalid email'; valid = false; }
    if (!password) { errs.password = 'Password is required'; valid = false; }
    else if (password.length < 6) { errs.password = 'Minimum 6 characters'; valid = false; }
    setErrors(errs);
    return valid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        const success = await register(fullName, email, password, phone);
        if (success) {
          Alert.alert('Success', 'Account created! Please login.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      } catch (e) { Alert.alert('Registration Failed', e); }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0A0F1E', '#0D1B3E', '#1A1040']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join TripLedger and start tracking smarter</Text>
            </View>

            {/* Glass Form */}
            <View style={styles.formCard}>
              <Input label="Full Name" icon="person-outline" placeholder="Your full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
              <Input label="Email Address" icon="mail-outline" placeholder="Your email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Phone (Optional)" icon="call-outline" placeholder="Your phone number" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" />
              <Input label="Password" icon="lock-closed-outline" placeholder="Create a password" value={password} onChangeText={setPassword} error={errors.password} password />

              <Button title="Create Account" onPress={handleRegister} isLoading={isLoading} style={{ marginTop: 8 }} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: SIZES.paddingLarge, paddingVertical: SIZES.padding },
  orb1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(99,102,241,0.1)', top: -60, right: -80 },
  orb2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(168,85,247,0.08)', bottom: 80, left: -80 },
  backButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  header: { marginBottom: 28 },
  title: { fontSize: SIZES.h1, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 8 },
  subtitle: { fontSize: SIZES.bodySmall, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 20 },
  formCard: {
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radiusXL, padding: SIZES.paddingLarge, ...SHADOWS.large,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' },
  footerText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontSize: SIZES.bodySmall },
  link: { color: COLORS.primaryLight, fontFamily: FONTS.semiBold, fontSize: SIZES.bodySmall },
});

export default RegisterScreen;
