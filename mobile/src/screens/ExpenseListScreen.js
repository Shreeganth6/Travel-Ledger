import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getTripExpenses } from '../api/expenses';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../constants/currencies';
import api from '../api/axios';

const CATEGORY_COLORS = {
  accommodation: '#60A5FA', food: '#34D399', transport: '#FBBF24',
  entertainment: '#F472B6', shopping: '#A78BFA', other: '#94A3B8',
};

const ExpenseListScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('member');
  const [tripStatus, setTripStatus] = useState('active');
  const [tripCurrency, setTripCurrency] = useState('INR');

  const fetchUserRole = async () => {
    try {
      const response = await api.get(`/trips/${tripId}`);
      const tripData = response.data?.data;
      if (tripData?.trip) {
        setTripStatus(tripData.trip.status);
        setTripCurrency(tripData.trip.currency || 'INR');
      }
      if (tripData?.members) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
        if (userInfo) {
          const me = tripData.members.find(m => Number(m.user_id) === Number(userInfo.user_id));
          if (me) setUserRole(me.role);
        }
      }
    } catch (err) { console.log('Role fetch error:', err); }
  };

  const fetchExpenses = async () => {
    try {
      const data = await getTripExpenses(tripId);
      setExpenses(data.data);
    } catch (e) { console.log('Expense fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchUserRole(); fetchExpenses(); }, [tripId]);
  const onRefresh = () => { setRefreshing(true); fetchExpenses(); };

  const renderItem = ({ item }) => {
    const catColor = CATEGORY_COLORS[item.category?.toLowerCase()] || CATEGORY_COLORS.other;
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigation.navigate('ExpenseDetails', { expense: item, tripId, userRole })}
      >
        <View style={styles.card}>
          <View style={[styles.accentBar, { backgroundColor: catColor }]} />
          <Ionicons name="receipt-outline" size={28} color={catColor} style={{ marginRight: 16, marginLeft: 12 }} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.expense_name}</Text>
            <Text style={styles.payer}>
              Paid by {item.created_by_name}
              {item.payer_count > 1 ? ` + ${item.payer_count - 1}` : ''}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amount}>{getCurrencySymbol(tripCurrency)}{parseFloat(item.total_amount).toLocaleString()}</Text>
            <Text style={styles.date}>{new Date(item.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && expenses.length === 0) return <Loader />;

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
          <Text style={styles.headerSub}>TRIP EXPENSES</Text>
          <Text style={styles.headerTitle}>Expenses</Text>
        </View>
        {tripStatus !== 'done' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense', { tripId })}
          >
            <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
              <Ionicons name="add" size={22} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={expenses}
        extraData={userRole}
        keyExtractor={(item) => item.expense_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState message="No expenses yet." icon="receipt-outline" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(99,102,241,0.07)', top: -80, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  addBtn: { ...SHADOWS.colored },
  addGradient: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100, paddingTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 10, overflow: 'hidden',
    ...SHADOWS.small,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 3 },
  payer: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: SIZES.h4, fontFamily: FONTS.bold, color: COLORS.primaryLight, marginBottom: 3 },
  date: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textTertiary },
});

export default ExpenseListScreen;
