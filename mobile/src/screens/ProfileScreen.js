import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  const avatar = userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile Hero */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{avatar}</Text>
              </View>
            </LinearGradient>
            <Text style={styles.name}>{userInfo?.name || 'User'}</Text>
            <Text style={styles.email}>{userInfo?.email || ''}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="airplane" size={12} color={COLORS.primaryLight} />
                <Text style={styles.badgeText}>Traveler</Text>
              </View>
            </View>
          </View>

          {/* Logout */}
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={{ marginTop: 40, borderColor: COLORS.error }}
            textStyle={{ color: COLORS.error }}
          />

          <Text style={styles.version}>Navigo v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  bgOrb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99,102,241,0.1)', top: -80, right: -80 },
  bgOrb2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(168,85,247,0.06)', bottom: 100, left: -80 },

  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },

  heroSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatarRing: { width: 96, height: 96, borderRadius: 32, padding: 3, marginBottom: 16, ...SHADOWS.glow },
  avatarInner: { flex: 1, borderRadius: 30, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontFamily: FONTS.heading, color: COLORS.textLight },
  name: { fontSize: SIZES.h2, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 4 },
  email: { fontSize: SIZES.bodySmall, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  badgeText: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },

  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 12 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, padding: 16, marginBottom: 10, ...SHADOWS.small },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, padding: 16, marginBottom: 10, ...SHADOWS.small },
  menuText: { flex: 1, fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary },

  version: { textAlign: 'center', marginTop: 20, fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textTertiary },
});

export default ProfileScreen;
