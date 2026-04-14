import React, { useState, useContext, useEffect } from 'react';
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

const EditProfileScreen = ({ navigation }) => {
  const { userInfo, updateProfile, getProfile, isLoading } = useContext(AuthContext);
  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchFullProfile = async () => {
      const data = await getProfile();
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    };
    fetchFullProfile();
  }, []);

  const validate = () => {
    let valid = true;
    let errs = {};
    if (!name.trim()) { errs.name = 'Name is required'; valid = false; }
    setErrors(errs);
    return valid;
  };

  const handleUpdate = async () => {
    if (validate()) {
      try {
        await updateProfile(name, phone);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (e) {
        Alert.alert('Error', e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={COLORS.gradientPrimary}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
              </LinearGradient>
              <Text style={styles.emailText}>{userInfo?.email}</Text>
              <View style={styles.readOnlyBadge}>
                <Ionicons name="lock-closed" size={12} color={COLORS.textTertiary} />
                <Text style={styles.readOnlyText}>Email cannot be changed</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Input
                label="Full Name"
                icon="person-outline"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
              
              <Input
                label="Phone Number"
                icon="call-outline"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primaryLight} />
                <Text style={styles.infoText}>
                  Your name and phone number will be visible to your trip members.
                </Text>
              </View>

              <Button
                title="Save Changes"
                onPress={handleUpdate}
                isLoading={isLoading}
                style={{ marginTop: 10 }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontFamily: FONTS.heading,
    color: COLORS.textLight,
  },
  scrollContainer: {
    padding: SIZES.paddingLarge,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 35,
    padding: 3,
    marginBottom: 16,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: FONTS.heading,
    color: COLORS.textLight,
  },
  emailText: {
    fontSize: SIZES.body,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: SIZES.tiny,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  formCard: {
    backgroundColor: COLORS.glass,
    borderRadius: SIZES.radiusXL,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.large,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99,102,241,0.05)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.caption,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default EditProfileScreen;
