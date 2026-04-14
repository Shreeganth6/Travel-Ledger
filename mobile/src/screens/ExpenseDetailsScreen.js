import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import { getCurrencySymbol } from '../constants/currencies';
import Loader from '../components/Loader';
import { getExpenseById, deleteExpense } from '../api/expenses';

const ExpenseDetailsScreen = ({ navigation, route }) => {
  const { expense: initialExpense, tripId, userRole } = route.params;
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripCurrency, setTripCurrency] = useState('INR');
  const [localUserRole, setLocalUserRole] = useState(userRole || 'member');
  const expenseId = initialExpense?.expense_id;

  const fetchExpenseDetails = async () => {
    try {
      const response = await getExpenseById(initialExpense.trip_id, expenseId);
      if (response.success && response.data) {
        setExpenseData(response.data);
        setTripCurrency(response.data.trip?.currency || 'INR');
        if (response.userRole) setLocalUserRole(response.userRole);
      } else {
        setExpenseData(response.data || response);
        if (response.userRole) setLocalUserRole(response.userRole);
      }
    } catch (e) { console.log('Expense detail error:', e); Alert.alert('Error', 'Could not load expense details'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchExpenseDetails(); }, [expenseId]);
  const onRefresh = () => { setRefreshing(true); fetchExpenseDetails(); };

  const executeDelete = async () => {
    try {
      const tid = tripId || initialExpense?.trip_id;
      await deleteExpense(tid, expenseId);
      if (Platform.OS === 'web') { window.alert('Expense deleted.'); navigation.goBack(); }
      else { setTimeout(() => { Alert.alert('Success', 'Expense deleted.', [{ text: 'OK', onPress: () => navigation.goBack() }]); }, 500); }
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Could not delete expense.';
      if (Platform.OS === 'web') window.alert(msg);
      else setTimeout(() => { Alert.alert('Error', msg); }, 500);
    }
  };

  const handleDelete = () => {
    const msg = `Delete "${expenseData?.expense?.expense_name}"? This cannot be undone.`;
    if (Platform.OS === 'web') { if (window.confirm(msg)) executeDelete(); }
    else {
      Alert.alert('Delete Expense', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const HeaderBar = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerSub}>EXPENSE</Text>
        <Text style={styles.headerTitle}>Details</Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading) return <View style={styles.container}><LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} /><HeaderBar /><Loader /></View>;
  if (!expenseData) return <View style={styles.container}><LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} /><HeaderBar /><View style={styles.errorWrap}><Text style={styles.errorText}>Expense not found.</Text></View></View>;

  const { expense, payers, participants } = expenseData;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      <HeaderBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Hero Amount Card */}
        <LinearGradient
          colors={['rgba(99,102,241,0.35)', 'rgba(168,85,247,0.25)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="receipt" size={28} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.heroAmount}>{getCurrencySymbol(tripCurrency)}{expense.total_amount}</Text>
          <Text style={styles.heroName}>{expense.expense_name}</Text>
          <Text style={styles.heroDate}>
            {new Date(expense.expense_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
        </LinearGradient>

        {/* Paid By */}
        <Text style={styles.sectionLabel}>PAID BY</Text>
        <View style={[styles.sectionCard, GLASS.cardStrong]}>
          {payers && payers.length > 0 ? payers.map((payer, i) => (
            <View key={i} style={[styles.personRow, i < payers.length - 1 && styles.rowBorder]}>
              <View style={styles.personLeft}>
                <View style={[styles.personAvatar, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)' }]}>
                  <Text style={[styles.personAvatarText, { color: COLORS.primaryLight }]}>{payer.full_name?.charAt(0) || '?'}</Text>
                </View>
                <Text style={styles.personName}>{payer.full_name}</Text>
              </View>
              <Text style={styles.personAmount}>{getCurrencySymbol(tripCurrency)}{payer.amount_paid}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No payer info</Text>}
        </View>

        {/* Split Amongst */}
        <Text style={styles.sectionLabel}>SPLIT AMONGST</Text>
        <View style={[styles.sectionCard, GLASS.cardStrong]}>
          {participants && participants.length > 0 ? participants.map((p, i) => (
            <View key={i} style={[styles.personRow, i < participants.length - 1 && styles.rowBorder]}>
              <View style={styles.personLeft}>
                <View style={[styles.personAvatar, { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.4)' }]}>
                  <Text style={[styles.personAvatarText, { color: COLORS.success }]}>{p.full_name?.charAt(0) || '?'}</Text>
                </View>
                <Text style={styles.personName}>{p.full_name}</Text>
              </View>
              <Text style={styles.personAmount}>{p.split_amount ? `${getCurrencySymbol(tripCurrency)}${p.split_amount}` : '–'}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Everyone in group</Text>}
        </View>

        {/* Note */}
        {expense.description ? (
          <>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <View style={[styles.sectionCard, GLASS.card, { marginBottom: 20 }]}>
              <Text style={styles.noteText}>{expense.description}</Text>
            </View>
          </>
        ) : null}

        {/* Delete */}
        {localUserRole === 'admin' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            <Text style={styles.deleteBtnText}>Delete Expense</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99,102,241,0.07)', top: -80, right: -80 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textSecondary, fontFamily: FONTS.regular },
  scrollContent: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 40 },

  heroCard: { borderRadius: SIZES.radiusXL, padding: 28, alignItems: 'center', marginBottom: 24, ...SHADOWS.colored },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroAmount: { fontSize: 40, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 6 },
  heroName: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 4, textAlign: 'center' },
  heroDate: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  categoryText: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.textLight, textTransform: 'capitalize', letterSpacing: 0.3 },

  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  sectionCard: { borderRadius: SIZES.radiusLarge, padding: 16, marginBottom: 20, ...SHADOWS.medium },
  personRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  personLeft: { flexDirection: 'row', alignItems: 'center' },
  personAvatar: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  personAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading },
  personName: { fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary },
  personAmount: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.textPrimary },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.regular, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  noteText: { fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 22 },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', borderRadius: SIZES.radius, paddingVertical: 14, marginBottom: 20, ...SHADOWS.small },
  deleteBtnText: { color: COLORS.error, fontSize: SIZES.body, fontFamily: FONTS.semiBold },
});

export default ExpenseDetailsScreen;
