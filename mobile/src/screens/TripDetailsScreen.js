import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Loader from '../components/Loader';
import Button from '../components/Button';
import { getTripSummary } from '../api/trips';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../constants/currencies';

const { width } = Dimensions.get('window');
const GAP = 12;
const HALF = (width - SIZES.paddingLarge * 2 - GAP) / 2;

const TripDetailsScreen = ({ navigation, route }) => {
  const { tripId, tripName } = route.params;
  const [summary, setSummary] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setError(null);
      const res = await getTripSummary(tripId);
      setSummary(res.trip);
      setUserRole(res.user_role);
    }
    catch (e) {
      console.log('Error:', e);
      setError(e.toString());
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleEndTrip = async () => {
    try {
      setEnding(true);
      await require('../api/trips').updateTripStatus(tripId, 'done');
      fetchSummary();
    } catch (e) {
      alert(e);
    } finally {
      setEnding(false);
    }
  };

  useEffect(() => { fetchSummary(); }, [tripId]);
  const onRefresh = () => { setRefreshing(true); fetchSummary(); };

  if (loading && !refreshing) return <Loader />;
  if (error || !summary) return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={{ color: COLORS.textPrimary, textAlign: 'center', fontSize: 18, fontFamily: FONTS.bold, marginBottom: 10 }}>Error loading trip</Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center', fontSize: 14, fontFamily: FONTS.regular }}>{error || 'No trip data found'}</Text>
        <Button title="Try Again" onPress={fetchSummary} style={{ marginTop: 30 }} />
      </View>
    </View>
  );

  const usagePercent = Math.min(isNaN(summary.budget_usage_percentage) ? 0 : summary.budget_usage_percentage, 100);
  const isOverBudget = (summary.remaining_budget || 0) < 0;

  const quickActions = [
    { icon: 'receipt', label: 'Expenses', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', onPress: () => navigation.navigate('Expenses', { tripId }) },
    { icon: 'cash', label: 'Settlement', color: '#A855F7', bg: 'rgba(168,85,247,0.15)', onPress: () => navigation.navigate('Settlement', { tripId }) },
    { icon: 'information-circle', label: 'Trip Info', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', onPress: () => navigation.navigate('TripMetadata', { tripId }) },
    { icon: 'stats-chart', label: 'Analytics', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', onPress: () => navigation.navigate('Analytics', { tripId }) },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>TRIP DETAILS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{tripName || summary.trip_name}</Text>
        </View>
        {userRole === 'admin' && summary.status !== 'done' && (
          <TouchableOpacity 
            style={[styles.endTripBtn, ending && { opacity: 0.6 }]} 
            onPress={handleEndTrip}
            disabled={ending}
          >
            <Ionicons name="stop-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.endTripText}>{ending ? '...' : 'End'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Budget Hero Card */}
        <LinearGradient
          colors={['rgba(99,102,241,0.4)', 'rgba(168,85,247,0.3)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.budgetCard}
        >
          <Text style={styles.budgetLabel}>Total Budget</Text>
          <Text style={styles.budgetAmount}>{getCurrencySymbol(summary.currency)}{(summary.budget || 0).toLocaleString()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <LinearGradient
              colors={isOverBudget ? COLORS.gradientDanger : COLORS.gradientSecondary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${usagePercent}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>{summary.budget_usage_percentage}% Used</Text>

          {/* Spent / Remaining row */}
          <View style={styles.budgetRow}>
            <View style={styles.budgetStat}>
              <Text style={styles.budgetStatLabel}>Spent</Text>
              <Text style={[styles.budgetStatValue, { color: COLORS.error }]}>
                {getCurrencySymbol(summary.currency)}{(summary.total_expenses || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetStat}>
              <Text style={styles.budgetStatLabel}>Remaining</Text>
              <Text style={[styles.budgetStatValue, { color: isOverBudget ? COLORS.error : COLORS.success }]}>
                {getCurrencySymbol(summary.currency)}{(summary.remaining_budget || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {summary.status === 'done' && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.statusText}>COMPLETED</Text>
            </View>
          )}
        </LinearGradient>

        {/* Bento Stats */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoCard, GLASS.cardStrong]}>
            <Ionicons name="people" size={20} color={COLORS.primaryLight} style={{ marginBottom: 8 }} />
            <Text style={styles.bentoValue}>{summary.member_count || 0}</Text>
            <Text style={styles.bentoLabel}>Members</Text>
          </View>
          <View style={[styles.bentoCard, GLASS.cardStrong]}>
            <Ionicons name="receipt" size={20} color={COLORS.accentCyan} style={{ marginBottom: 8 }} />
            <Text style={styles.bentoValue}>{summary.expense_count || 0}</Text>
            <Text style={styles.bentoLabel}>Expenses</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={[styles.actionTile, GLASS.card]} onPress={a.onPress} activeOpacity={0.8}>
              <Ionicons name={a.icon} size={28} color={a.color} style={{ marginBottom: 10 }} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {summary.status !== 'done' ? (
          <Button
            title="＋  Add Expense"
            onPress={() => navigation.navigate('AddExpense', { tripId })}
            style={{ marginTop: 8, marginBottom: 32 }}
          />
        ) : (
          <View style={styles.doneMessage}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.textTertiary} />
            <Text style={styles.doneMessageText}>No more expenses can be added to this trip.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(99,102,241,0.08)', top: -100, right: -80 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },

  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 120 },

  // Budget Card
  budgetCard: { borderRadius: SIZES.radiusXL, padding: 24, marginBottom: 16, ...SHADOWS.colored },
  budgetLabel: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 6 },
  budgetAmount: { fontSize: 40, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 20 },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  budgetStatValue: { fontSize: SIZES.h4, fontFamily: FONTS.bold },
  budgetDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Bento
  bentoRow: { flexDirection: 'row', gap: GAP, marginBottom: 20 },
  bentoCard: { flex: 1, borderRadius: SIZES.radiusLarge, padding: 18, ...SHADOWS.medium },
  bentoValue: { fontSize: 28, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 4 },
  bentoLabel: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 12 },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 20 },
  actionTile: { width: HALF, padding: 18, borderRadius: SIZES.radiusLarge, alignItems: 'center', ...SHADOWS.small },

  actionLabel: { fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },

  endTripBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  endTripText: { color: COLORS.error, fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold },

  statusBadge: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: COLORS.success, fontSize: SIZES.tiny, fontFamily: FONTS.bold, letterSpacing: 0.5 },

  doneMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, opacity: 0.8 },
  doneMessageText: { color: COLORS.textTertiary, fontSize: SIZES.bodySmall, fontFamily: FONTS.medium },
});

export default TripDetailsScreen;
