import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getSettlementSuggestions, getTripSettlementsHistory } from '../api/settlements';
import { getTripById } from '../api/trips';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES, getCurrencySymbol } from '../constants/currencies';
import { getExchangeRates } from '../api/currency';


const SettlementScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [preferredCurrency, setPreferredCurrency] = useState(null);
  const [rates, setRates] = useState({});
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchSettlements = async () => {
    try {
      setError(null);
      const [settlementData, tripData, historyData] = await Promise.all([
        getSettlementSuggestions(tripId),
        getTripById(tripId),
        getTripSettlementsHistory(tripId)
      ]);

      setSuggestions(settlementData.data.settlements);
      setBalances(settlementData.data.balances);
      setTrip(tripData.trip);
      if (!preferredCurrency) setPreferredCurrency(tripData.trip.currency || 'INR');
      setHistory(historyData.data);
    } catch (e) {
      console.log('Settlement error:', e);
      setError(e.toString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSettlements(); }, [tripId]);
  
  const handleCurrencyChange = async (newCurrency) => {
    setShowCurrencyModal(false);
    if (newCurrency === trip.currency) {
      setPreferredCurrency(newCurrency);
      setRates({});
      return;
    }
    
    setConverting(true);
    try {
      const data = await getExchangeRates(trip.currency);
      setRates(data);
      setPreferredCurrency(newCurrency);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch real-time rates');
    } finally {
      setConverting(false);
    }
  };

  const convert = (amount) => {
    if (!preferredCurrency || preferredCurrency === trip?.currency || !rates[preferredCurrency]) {
      return amount;
    }
    return amount * rates[preferredCurrency];
  };

  const onRefresh = () => { setRefreshing(true); fetchSettlements(); };

  const isTripDone = trip?.status === 'done';

  const renderBalanceItem = ({ item }) => {
    const isPositive = item.balance > 0;
    const isNegative = item.balance < 0;
    const color = isPositive ? COLORS.success : isNegative ? COLORS.error : COLORS.textSecondary;

    return (
      <View style={styles.balanceRow}>
        <View style={[styles.balanceAvatar, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
          <Text style={[styles.balanceAvatarText, { color }]}>{item.full_name.charAt(0)}</Text>
        </View>
        <Text style={styles.balanceName}>{item.full_name}</Text>
        <Text style={[styles.balanceAmount, { color }]}>
          {isPositive ? '+' : ''}{getCurrencySymbol(preferredCurrency)}{parseFloat(convert(item.balance)).toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderSuggestionItem = ({ item }) => {
    const isPaid = item.type === 'paid';
    
    return (
      <TouchableOpacity
        style={[
          styles.settlementCard, 
          !isTripDone && !isPaid && { opacity: 0.7 },
          isPaid && { borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.05)' }
        ]}
        disabled={!isTripDone || isPaid}
        onPress={() => navigation.navigate('Payment', {
          tripId,
          payer: { user_id: item.from_user_id, name: item.from_user_name },
          receiver: { user_id: item.to_user_id, name: item.to_user_name },
          amount: item.amount,
          preferredAmount: convert(item.amount),
          preferredCurrency: preferredCurrency
        })}
      >
        <View style={styles.settlementRow}>
          {/* From user */}
          <View style={styles.userBlock}>
            <View style={[styles.userAvatar, { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.3)' }]}>
              <Ionicons name="person" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>{item.from_user_name}</Text>
          </View>

          {/* Arrow + Amount */}
          <View style={styles.arrowBlock}>
            <Text style={[styles.settlementAmount, isPaid && { color: COLORS.success }]}>
              {getCurrencySymbol(item.paid_currency || preferredCurrency)}{parseFloat(item.paid_amount || convert(item.amount)).toFixed(0)}
            </Text>
            <View style={styles.arrowLine}>
              <View style={[styles.arrowDash, isPaid && { backgroundColor: COLORS.success }]} />
              <Ionicons name="chevron-forward" size={14} color={isPaid ? COLORS.success : COLORS.primaryLight} />
            </View>
          </View>

          {/* To user */}
          <View style={styles.userBlock}>
            <View style={[styles.userAvatar, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }]}>
              <Ionicons name="person" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>{item.to_user_name}</Text>
          </View>
        </View>
        <View style={styles.settlementFooter}>
          <Text style={styles.settlementDesc}>
            {item.from_user_name} {isPaid ? 'paid' : 'owes'} {item.to_user_name}
          </Text>
          {isPaid ? (
            <View style={[styles.payBadge, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' }]}>
              <Text style={[styles.payBadgeText, { color: COLORS.success }]}>Paid</Text>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            </View>
          ) : isTripDone && (
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.primaryLight} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && suggestions.length === 0 && history.length === 0) return <Loader />;

  if (error) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>FINANCES</Text>
          <Text style={styles.headerTitle}>Settlements</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={{ color: COLORS.textPrimary, textAlign: 'center', fontSize: 18, fontFamily: FONTS.bold, marginBottom: 10 }}>Error loading settlements</Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center', fontSize: 14, fontFamily: FONTS.regular }}>{error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 30, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center' }}
          onPress={fetchSettlements}
        >
          <Text style={{ color: COLORS.white, fontFamily: FONTS.bold }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const combinedData = [
    ...suggestions.map(s => ({ ...s, type: 'suggestion' })),
    ...history.map(h => ({ 
      from_user_name: h.payer, 
      to_user_name: h.receiver, 
      amount: h.amount, 
      type: 'paid',
      settlement_id: h.settlement_id 
    }))
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>FINANCES</Text>
          <Text style={styles.headerTitle}>Settlements</Text>
        </View>
        <TouchableOpacity 
          style={styles.currencyBtn} 
          onPress={() => setShowCurrencyModal(true)} 
          disabled={converting}
        >
          <Text style={styles.currencyBtnText}>{preferredCurrency || '...'}</Text>
          <Ionicons name="swap-horizontal" size={14} color={COLORS.primaryLight} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={combinedData}
        keyExtractor={(item, index) => item.settlement_id ? `history-${item.settlement_id}` : `suggestion-${index}`}
        renderItem={renderSuggestionItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionLabel}>CURRENT BALANCES</Text>
            <View style={[styles.balanceCard, GLASS.cardStrong]}>
              {balances.map((item) => (
                <View key={item.user_id}>{renderBalanceItem({ item })}</View>
              ))}
              {balances.length === 0 && <Text style={styles.emptyBalanceText}>No balances yet</Text>}
            </View>
            <Text style={styles.sectionLabel}>SETTLEMENTS & SUGGESTIONS</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState message="All squared up! No settlements needed." icon="checkmark-done-outline" />}
      />

      {/* Currency Selector Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCurrencyModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Preferred Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => handleCurrencyChange(item.code)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.modalItemText}>{item.name} ({item.code})</Text>
                    {preferredCurrency === item.code && <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {converting && (
        <View style={styles.convertingOverlay}>
          <Loader size="small" />
          <Text style={styles.convertingText}>Updating market rates...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(168,85,247,0.07)', top: -80, left: -80 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  list: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },
  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },

  balanceCard: { borderRadius: SIZES.radiusLarge, padding: 16, marginBottom: 20, ...SHADOWS.medium },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  balanceAvatar: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  balanceAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading },
  balanceName: { flex: 1, fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary, marginLeft: 12 },
  balanceAmount: { fontSize: SIZES.body, fontFamily: FONTS.bold },
  emptyBalanceText: { textAlign: 'center', color: COLORS.textTertiary, fontFamily: FONTS.regular, paddingVertical: 16 },

  settlementCard: {
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radiusLarge, padding: 18, marginBottom: 12, ...SHADOWS.small,
  },
  settlementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userBlock: { alignItems: 'center', width: '28%' },
  userAvatar: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  userName: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.textPrimary, textAlign: 'center' },
  arrowBlock: { alignItems: 'center', flex: 1 },
  settlementAmount: { fontSize: SIZES.h4, fontFamily: FONTS.bold, color: COLORS.primaryLight, marginBottom: 4 },
  arrowLine: { flexDirection: 'row', alignItems: 'center' },
  arrowDash: { width: 30, height: 1.5, backgroundColor: COLORS.primaryLight, marginRight: 2 },
  settlementDesc: { color: COLORS.textSecondary, fontSize: SIZES.caption, fontFamily: FONTS.regular },
  settlementFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)' },
  payBadgeText: { fontSize: 10, fontFamily: FONTS.bold, color: COLORS.primaryLight, marginRight: 4, textTransform: 'uppercase' },
  currencyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 6 },
  currencyBtnText: { color: COLORS.textPrimary, fontSize: 12, fontFamily: FONTS.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundElevated, borderTopLeftRadius: SIZES.radiusXL, borderTopRightRadius: SIZES.radiusXL, padding: 20, maxHeight: '60%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary },
  convertingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,30,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  convertingText: { color: COLORS.textPrimary, marginTop: 10, fontFamily: FONTS.medium, fontSize: 14 },
});

export default SettlementScreen;
