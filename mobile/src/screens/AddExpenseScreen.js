import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, FlatList, Platform, Animated } from 'react-native';
import AIInsightCard from '../components/AIInsightCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { getTripById } from '../api/trips';
import { createExpense, extractReceipt, extractVoiceExpense } from '../api/expenses';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol } from '../constants/currencies';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const CATEGORIES = [
  { id: 'accommodation', name: 'Accommodation', icon: 'bed' },
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'transport', name: 'Transportation', icon: 'bus' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
  { id: 'shopping', name: 'Shopping', icon: 'cart' },
  { id: 'other', name: 'Other', icon: 'options' },
];

const AddExpenseScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const { userInfo } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [tripCurrency, setTripCurrency] = useState('INR');

  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [payers, setPayers] = useState([]);
  const [participants, setParticipants] = useState([]);

  const [showPayerModal, setShowPayerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const recordingRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  useEffect(() => { fetchTripMembers(); }, []);

  const fetchTripMembers = async () => {
    try {
      const data = await getTripById(tripId);
      setMembers(data.members);
      setTripCurrency(data.trip.currency || 'INR');
      const me = data.members.find(m => m.user_id === userInfo.id);
      if (me) setPayers([{ ...me, amount_paid: '' }]);
      setParticipants(data.members);
    } catch (e) { Alert.alert('Error', 'Could not load trip members'); }
    finally { setLoading(false); }
  };

  const toggleParticipant = (member) => {
    if (participants.find(p => p.user_id === member.user_id)) setParticipants(participants.filter(p => p.user_id !== member.user_id));
    else setParticipants([...participants, member]);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  // ── OCR ──
  const handleScanReceipt = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission required'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) processReceiptImage(result.assets[0]);
    } catch (e) { Alert.alert('Error', 'Camera failed'); }
  };

  const processReceiptImage = async (imageAsset) => {
    setIsScanning(true);
    try {
      const uri = imageAsset.uri; const filename = uri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename); const type = match ? `image/${match[1]}` : 'image';
      const formData = new FormData(); formData.append('receipt', { uri, name: filename, type });
      const response = await extractReceipt(formData);
      if (response.success && response.data) {
        const ext = response.data;
        if (ext.merchant) setExpenseName(ext.merchant);
        if (ext.total_amount) setAmount(ext.total_amount.toString());
        if (ext.date) { try { const d = new Date(ext.date); if (!isNaN(d)) setDate(d); } catch (_) {} }
        if (ext.category) { const c = CATEGORIES.find(c => c.id === ext.category); if (c) setCategory(c); }
        Alert.alert('Scan Complete', 'Details auto-filled!');
      } else Alert.alert('Scan Failed', 'Could not extract info.');
    } catch (e) { Alert.alert('Error', e.toString()); }
    finally { setIsScanning(false); }
  };

  // ── VOICE ──
  const startPulse = () => { pulseLoop.current = Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })])); pulseLoop.current.start(); };
  const stopPulse = () => { if (pulseLoop.current) pulseLoop.current.stop(); pulseAnim.setValue(1); };
  const isRecordingActionRef = useRef(false);

  useEffect(() => { return () => { if (recordingRef.current) { recordingRef.current.stopAndUnloadAsync().catch(() => {}); recordingRef.current = null; } }; }, []);

  const cleanupRecording = async () => {
    if (recordingRef.current) { try { await recordingRef.current.stopAndUnloadAsync(); } catch (_) {} recordingRef.current = null; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
  };

  const handleMicPress = async () => {
    if (isRecordingActionRef.current) return;
    isRecordingActionRef.current = true;
    try {
      if (isRecording) {
        stopPulse(); setIsRecording(false); setIsVoiceProcessing(true);
        const cur = recordingRef.current; recordingRef.current = null;
        if (!cur) throw new Error('No active recording.');
        await cur.stopAndUnloadAsync();
        const uri = cur.getURI(); await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        if (!uri) throw new Error('No audio file.');
        const names = members.map(m => m.full_name); const fn = uri.split('/').pop() || 'recording.m4a';
        const response = await extractVoiceExpense(uri, fn, names);
        if (response.success && response.data) applyVoiceExpense(response.data);
        else Alert.alert('Voice Failed', 'Could not understand. Try again.');
      } else {
        await cleanupRecording();
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) { Alert.alert('Permission', 'Microphone access needed.'); return; }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef.current = recording; setIsRecording(true); startPulse();
      }
    } catch (err) {
      await cleanupRecording(); setIsRecording(false); stopPulse();
      Alert.alert('Voice Error', err?.message || 'Voice processing failed.');
    } finally { setIsVoiceProcessing(false); isRecordingActionRef.current = false; }
  };

  const applyVoiceExpense = (data) => {
    if (data.expense_name) setExpenseName(data.expense_name);
    if (data.amount) setAmount(data.amount.toString());
    if (data.category) { const c = CATEGORIES.find(c => c.id === data.category); if (c) setCategory(c); }
    const isNameMatch = (a, b) => { if (!a || !b) return false; const ac = a.toLowerCase().replace(/[^a-z0-9]/g, ''); const bc = b.toLowerCase().replace(/[^a-z0-9]/g, ''); if (ac.includes(bc) || bc.includes(ac)) return true; const wa = a.toLowerCase().split(/\s+/).filter(w => w.length > 2); const wb = b.toLowerCase().split(/\s+/).filter(w => w.length > 2); for (const x of wa) for (const y of wb) if (x === y || x.includes(y) || y.includes(x)) return true; return false; };
    if (data.payers?.length > 0) {
      const matched = []; data.payers.forEach(pd => { const m = members.find(m => isNameMatch(m.full_name, pd.payer_name)); if (m) matched.push({ ...m, amount_paid: pd.amount_paid ? pd.amount_paid.toString() : '' }); });
      if (matched.length > 0) setPayers(matched);
      else { const me = members.find(m => m.user_id === userInfo?.id); if (me) setPayers([{ ...me, amount_paid: data.amount ? data.amount.toString() : '' }]); }
    }
    if (data.participant_names?.length > 0) {
      const isAll = data.participant_names.some(n => { const l = n.toLowerCase(); return l.includes('all') || l.includes('every'); });
      if (data.participant_names.length === members.length || isAll) setParticipants([...members]);
      else { const matched = members.filter(m => data.participant_names.some(n => isNameMatch(m.full_name, n))); setParticipants(matched.length > 0 ? matched : [...members]); }
    } else setParticipants([...members]);
    const transcript = data.transcript ? `\n\nHeard: "${data.transcript}"` : '';
    Alert.alert('Voice Entry Applied ✅', `Fields auto-filled.${transcript}${data.date_missing ? '\n\n📅 Select date manually.' : ''}`);
  };

  const handleCreate = async () => {
    if (!expenseName || !amount || payers.length === 0 || participants.length === 0) { Alert.alert('Error', 'Fill all fields'); return; }
    const totalPaid = payers.reduce((s, p) => s + (parseFloat(p.amount_paid) || 0), 0);
    const expAmt = parseFloat(amount);
    const symbol = getCurrencySymbol(tripCurrency);
    if (Math.abs(totalPaid - expAmt) > 0.01) { Alert.alert('Error', `Payer amounts (${symbol}${totalPaid.toFixed(2)}) ≠ total (${symbol}${expAmt.toFixed(2)})`); return; }
    setSubmitting(true);
    try {
      const payload = { expense_name: expenseName, total_amount: expAmt, expense_date: date.toISOString().split('T')[0], category: category.id, description, payers: payers.map(p => ({ user_id: p.user_id, amount_paid: parseFloat(p.amount_paid) })), participants: participants.map(p => ({ user_id: p.user_id })), split_type: 'equal' };
      const response = await createExpense(tripId, payload);
      if (response.aiInsight) { setAiInsight(response.aiInsight); setShowInsightModal(true); }
      else Alert.alert('Success', 'Expense added!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', e); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>NEW</Text>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>
        <View style={styles.headerActions}>
          {isVoiceProcessing ? <Loader /> : (
            <TouchableOpacity onPress={handleMicPress} activeOpacity={0.7} style={styles.micWrapper}>
              <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
              <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={24} color={isRecording ? COLORS.error : COLORS.primaryLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleScanReceipt} disabled={isScanning} style={styles.scanBtn}>
            {isScanning ? <Loader /> : <Ionicons name="scan-outline" size={22} color={COLORS.primaryLight} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Input label="Expense Name" icon="pricetag-outline" placeholder="e.g. Hotel Stay" value={expenseName} onChangeText={setExpenseName} />
        <Input label={`Total Amount (${getCurrencySymbol(tripCurrency)})`} icon="cash-outline" placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowCategoryModal(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={category.icon} size={18} color={COLORS.primaryLight} style={{ marginRight: 10 }} />
            <Text style={styles.selectorText}>{category.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
            <Text style={styles.selectorText}>{date.toLocaleDateString()}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />}

        <Input label="Description (Optional)" icon="document-text-outline" placeholder="Notes..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        {/* Payers */}
        <Text style={styles.label}>Paid By</Text>
        {payers.map((payer, idx) => (
          <View key={payer.user_id} style={styles.payerRow}>
            <View style={styles.payerAvatar}><Text style={styles.payerAvatarText}>{payer.full_name?.charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payerName}>{payer.full_name}</Text>
              <Input placeholder="Amount" keyboardType="numeric" value={payer.amount_paid} onChangeText={(v) => { const u = [...payers]; u[idx].amount_paid = v; setPayers(u); }} containerStyle={{ marginTop: 4, marginBottom: 0 }} />
            </View>
            <TouchableOpacity onPress={() => setPayers(payers.filter((_, i) => i !== idx))} style={{ marginLeft: 8 }}>
              <Ionicons name="close-circle" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addPayerBtn} onPress={() => setShowPayerModal(true)}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primaryLight} />
          <Text style={styles.addPayerText}>Add Payer</Text>
        </TouchableOpacity>

        {/* Participants */}
        <Text style={styles.label}>Split Amongst ({participants.length})</Text>
        <View style={styles.chipsWrap}>
          {members.map(m => {
            const sel = participants.find(p => p.user_id === m.user_id);
            return (
              <TouchableOpacity key={m.user_id} style={[styles.chip, sel && styles.chipSelected]} onPress={() => toggleParticipant(m)}>
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                  {m.user_id === userInfo.id ? 'You' : m.full_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button title="Add Expense" onPress={handleCreate} isLoading={submitting} style={{ marginTop: 24, marginBottom: 40 }} />
      </ScrollView>

      {/* Payer Modal */}
      <Modal visible={showPayerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPayerModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Payer</Text>
            <FlatList
              data={members.filter(m => !payers.find(p => p.user_id === m.user_id))}
              keyExtractor={item => item.user_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setPayers([...payers, { ...item, amount_paid: '' }]); setShowPayerModal(false); }}>
                  <View style={styles.modalItemAvatar}><Text style={styles.modalItemAvatarText}>{item.full_name.charAt(0)}</Text></View>
                  <Text style={styles.modalItemText}>{item.full_name}</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Cancel" variant="ghost" onPress={() => setShowPayerModal(false)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      {/* AI Insight Modal */}
      <Modal visible={showInsightModal} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={styles.insightModal}>
            <Text style={styles.insightTitle}>Expense Added! 🎉</Text>
            <AIInsightCard insight={aiInsight} />
            <TouchableOpacity style={styles.insightDismiss} onPress={() => { setShowInsightModal(false); navigation.goBack(); }}>
              <Text style={styles.insightDismissText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCategoryModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setCategory(item); setShowCategoryModal(false); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.catIconBg, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                      <Ionicons name={item.icon} size={20} color={COLORS.primaryLight} />
                    </View>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </View>
                  {category.id === item.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryLight} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(168,85,247,0.06)', bottom: 100, left: -100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.paddingLarge, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  headerSub: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micWrapper: { position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  micPulse: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.error },
  scanBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 120 },
  label: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 8, marginTop: 12, letterSpacing: 0.3 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, height: 52, paddingHorizontal: 16, marginBottom: 4 },
  selectorText: { fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.textPrimary },
  payerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, padding: 12, marginBottom: 8 },
  payerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  payerAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading, color: COLORS.primaryLight },
  payerName: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 2 },
  addPayerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  addPayerText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: SIZES.caption, fontFamily: FONTS.medium },
  chipTextSelected: { color: COLORS.white, fontFamily: FONTS.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundElevated, borderTopLeftRadius: SIZES.radiusXL, borderTopRightRadius: SIZES.radiusXL, padding: 20, maxHeight: '60%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modalItemAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading, color: COLORS.primaryLight },
  modalItemText: { fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary },
  catIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  insightModal: { backgroundColor: COLORS.backgroundElevated, borderRadius: SIZES.radiusXL, padding: 24, ...SHADOWS.medium },
  insightTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },
  insightDismiss: { marginTop: 16, alignItems: 'center', paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: SIZES.radius },
  insightDismissText: { color: COLORS.white, fontFamily: FONTS.semiBold, fontSize: SIZES.body },
});

export default AddExpenseScreen;
