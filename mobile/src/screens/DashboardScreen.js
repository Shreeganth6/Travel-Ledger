import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';
import { getTrips } from '../api/trips';

const { width } = Dimensions.get('window');
const BENTO_GAP = 12;
const BENTO_HALF = (width - SIZES.paddingLarge * 2 - BENTO_GAP) / 2;

const DashboardScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try { const data = await getTrips(); setTrips(data); }
    catch (e) { console.log('Dashboard error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (isFocused) fetchData(); }, [isFocused]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading && !refreshing && trips.length === 0) return <Loader />;

  const recentTrips = trips.slice(0, 3);
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => t.status === 'active').length;
  const completedTrips = trips.filter(t => t.status === 'done').length;

  const getAvatar = () => {
    const name = userInfo?.name || 'T';
    return name.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.username}>{userInfo?.name || 'Traveler'} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getAvatar()}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Bento Stats Grid ── */}
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.bentoGrid}>
          {/* Total Trips — wide card */}
          <LinearGradient
            colors={['rgba(99,102,241,0.35)', 'rgba(168,85,247,0.25)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bentoCard, styles.bentoWide]}
          >
            <Ionicons name="airplane" size={26} color={COLORS.primaryLight} style={{ marginBottom: 12 }} />
            <Text style={styles.bentoValue}>{totalTrips}</Text>
            <Text style={styles.bentoLabel}>Total Trips</Text>
            <Text style={styles.bentoSub}>All time trips</Text>
          </LinearGradient>

          {/* Active */}
          <View style={[styles.bentoCard, styles.bentoHalf, GLASS.cardStrong]}>
            <Ionicons name="radio-button-on" size={22} color={COLORS.success} style={{ marginBottom: 12 }} />
            <Text style={[styles.bentoValue, { color: COLORS.success }]}>{activeTrips}</Text>
            <Text style={styles.bentoLabel}>Active</Text>
          </View>

          {/* Completed */}
          <View style={[styles.bentoCard, styles.bentoHalf, GLASS.cardStrong]}>
            <Ionicons name="checkmark-done" size={22} color={COLORS.info} style={{ marginBottom: 12 }} />
            <Text style={[styles.bentoValue, { color: COLORS.info }]}>{completedTrips}</Text>
            <Text style={styles.bentoLabel}>Done</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateTrip')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="add" size={32} color={COLORS.white} style={{ marginBottom: 12 }} />
              <Text style={styles.actionTitle}>New Trip</Text>
              <Text style={styles.actionSub}>Start planning</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Trips')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={COLORS.gradientSecondary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Ionicons name="list" size={32} color={COLORS.white} style={{ marginBottom: 12 }} />
              <Text style={styles.actionTitle}>All Trips</Text>
              <Text style={styles.actionSub}>View history</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Recent Trips ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT TRIPS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Trips')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        {recentTrips.length > 0 ? (
          recentTrips.map((trip) => (
            <TouchableOpacity
              key={trip.trip_id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TripDetails', { tripId: trip.trip_id })}
            >
              <View style={styles.tripCard}>
                <View style={[styles.tripAccent, { backgroundColor: trip.status === 'active' ? COLORS.success : COLORS.info }]} />
                <View style={styles.tripIconWrap}>
                  <Ionicons name="location" size={20} color={COLORS.primaryLight} />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripName}>{trip.trip_name}</Text>
                  <Text style={styles.tripDate}>
                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: trip.status === 'active' ? COLORS.successLight : COLORS.infoLight }]}>
                  <Text style={[styles.statusText, { color: trip.status === 'active' ? COLORS.success : COLORS.info }]}>
                    {trip.status === 'done' ? 'Completed' : trip.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="airplane-outline" size={36} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySub}>Create your first trip to get started!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb1: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(99,102,241,0.08)', top: -120, right: -100 },
  bgOrb2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(168,85,247,0.06)', bottom: 200, left: -120 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 12, paddingBottom: 20 },
  headerLeft: {},
  greeting: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  username: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glassMedium, borderWidth: 1, borderColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.primaryLight },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },

  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  seeAll: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },

  // Bento Grid
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: BENTO_GAP, marginBottom: 24 },
  bentoCard: { borderRadius: SIZES.radiusLarge, padding: 18, ...SHADOWS.medium },
  bentoWide: { width: '100%' },
  bentoHalf: { width: BENTO_HALF },
  bentoValue: { fontSize: 36, fontFamily: FONTS.heading, color: COLORS.textLight, lineHeight: 42 },
  bentoLabel: { fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 2 },
  bentoSub: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textTertiary, marginTop: 2 },

  // Quick Actions
  actionsRow: { flexDirection: 'row', gap: BENTO_GAP, marginBottom: 24 },
  actionCard: { flex: 1, borderRadius: SIZES.radiusLarge, overflow: 'hidden', ...SHADOWS.colored },
  actionGradient: { padding: 20, alignItems: 'flex-start', minHeight: 130 },
  actionTitle: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.white },
  actionSub: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  // Trip Cards
  tripCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, overflow: 'hidden' },
  tripAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  tripIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginLeft: 8 },
  tripInfo: { flex: 1 },
  tripName: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 3 },
  tripDate: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  statusText: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, textTransform: 'capitalize', letterSpacing: 0.3 },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 4 },
  emptySub: { fontSize: SIZES.bodySmall, fontFamily: FONTS.regular, color: COLORS.textTertiary, textAlign: 'center' },
});

export default DashboardScreen;
