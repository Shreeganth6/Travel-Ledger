import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getTrips } from '../api/trips';

const STATUS_COLORS = {
  active: COLORS.success,
  completed: COLORS.info,
  default: COLORS.textTertiary,
};

const TripListScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try { const data = await getTrips(); setTrips(data); }
    catch (e) { console.log('Error fetching trips:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (isFocused) fetchTrips(); }, [isFocused]);
  const onRefresh = () => { setRefreshing(true); fetchTrips(); };

  const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.default;

  const renderItem = ({ item, index }) => {
    const accent = getStatusColor(item.status);
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigation.navigate('TripDetails', { tripId: item.trip_id, tripName: item.trip_name })}
        style={[styles.card, { marginBottom: index === trips.length - 1 ? 24 : 10 }]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <Ionicons name="location-sharp" size={28} color={accent} style={{ marginRight: 16, marginLeft: 12 }} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.trip_name}</Text>
          <Text style={styles.date}>
            {new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.right}>
          <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{item.status}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && trips.length === 0) return <Loader />;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>YOUR JOURNEYS</Text>
            <Text style={styles.headerTitle}>My Trips</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateTrip')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.addGradient}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FlatList
          data={trips}
          keyExtractor={(item) => item.trip_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState message="No trips yet. Create one!" icon="airplane-outline" />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  bgOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99,102,241,0.08)', top: -80, right: -80 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.paddingLarge, paddingTop: 16, paddingBottom: 20,
  },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: SIZES.h2, fontFamily: FONTS.heading, color: COLORS.textLight },
  addBtn: { ...SHADOWS.colored },
  addGradient: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radiusLarge, padding: 14, overflow: 'hidden',
    ...SHADOWS.medium,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 4 },
  date: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  right: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, textTransform: 'capitalize', letterSpacing: 0.3 },
});

export default TripListScreen;
