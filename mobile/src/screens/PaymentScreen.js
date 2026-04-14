import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../constants/currencies';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import { recordSettlement } from '../api/settlements';
import Loader from '../components/Loader';

const PaymentScreen = ({ navigation, route }) => {
  const { tripId, payer, receiver, amount, preferredAmount, preferredCurrency } = route.params;
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      await recordSettlement(tripId, {
        payer_user_id: payer.user_id,
        receiver_user_id: receiver.user_id,
        amount: amount,
        payment_method: 'simulated',
        paid_currency: preferredCurrency,
        paid_amount: preferredAmount
      });
      
      setSuccessVisible(true);
      setTimeout(() => {
        setSuccessVisible(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Alert.alert('Payment Failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#1A2B4E']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simulated Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.paymentCard, GLASS.cardStrong]}>
          <Text style={styles.label}>AMOUNT TO PAY</Text>
          <Text style={styles.amount}>
            {getCurrencySymbol(preferredCurrency)}{parseFloat(preferredAmount || amount).toFixed(2)}
          </Text>
          {preferredCurrency && preferredCurrency !== 'USD' && ( // assuming USD was base for example
             <Text style={styles.originalAmount}>Original: {amount} (Trip Base)</Text>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.transferRow}>
            <View style={styles.userSection}>
              <View style={[styles.avatar, { backgroundColor: COLORS.error + '20' }]}>
                <Text style={[styles.avatarText, { color: COLORS.error }]}>{payer.name.charAt(0)}</Text>
              </View>
              <Text style={styles.userName}>{payer.name}</Text>
              <Text style={styles.userRole}>Payer</Text>
            </View>

            <Ionicons name="arrow-forward" size={24} color={COLORS.textTertiary} />

            <View style={styles.userSection}>
              <View style={[styles.avatar, { backgroundColor: COLORS.success + '20' }]}>
                <Text style={[styles.avatarText, { color: COLORS.success }]}>{receiver.name.charAt(0)}</Text>
              </View>
              <Text style={styles.userName}>{receiver.name}</Text>
              <Text style={styles.userRole}>Receiver</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primaryLight} />
          <Text style={styles.infoText}>
            This is a simulated payment. No real money will be transferred. This will mark the settlement as paid in the system.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.payButton, loading && { opacity: 0.7 }]} 
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <Loader size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Confirm & Pay {getCurrencySymbol(preferredCurrency)}{parseFloat(preferredAmount || amount).toFixed(2)}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Animation / Modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.successCard, GLASS.cardStrong]}>
            <View style={styles.successIconBg}>
              <Ionicons name="checkmark" size={50} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSub}>Settlement recorded successfully.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: COLORS.glass, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  paymentCard: { 
    borderRadius: 24, 
    padding: 30, 
    alignItems: 'center',
    marginBottom: 24
  },
  label: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 2, marginBottom: 8 },
  amount: { fontSize: 42, fontFamily: FONTS.bold, color: COLORS.textLight, marginBottom: 30 },
  divider: { width: '100%', height: 1, backgroundColor: COLORS.glassBorder, marginBottom: 30 },
  transferRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  userSection: { alignItems: 'center', width: '40%' },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontFamily: FONTS.bold },
  userName: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  userRole: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textTertiary },
  infoBox: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(56,189,248,0.1)', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(56,189,248,0.2)',
    marginBottom: 40
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  payButton: { 
    backgroundColor: COLORS.primary, 
    height: 64, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    ...SHADOWS.medium
  },
  payButtonText: { fontSize: 18, fontFamily: FONTS.bold, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  successCard: { width: '80%', padding: 40, borderRadius: 30, alignItems: 'center' },
  successIconBg: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(52,211,153,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(52,211,153,0.3)'
  },
  successTitle: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textLight, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' }
});

export default PaymentScreen;
