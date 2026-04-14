import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { createTrip } from '../api/trips';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES } from '../constants/currencies';

const CreateTripScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES[0]); // Default to INR
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    if (!newMemberEmail || !newMemberName) { Alert.alert('Error', 'Enter both name and email'); return; }
    if (!/\S+@\S+\.\S+/.test(newMemberEmail)) { Alert.alert('Error', 'Invalid email'); return; }
    if (members.find(m => m.email === newMemberEmail)) { Alert.alert('Error', 'Already added'); return; }
    setMembers([...members, { name: newMemberName, email: newMemberEmail }]);
    setNewMemberName(''); setNewMemberEmail(''); setShowMemberModal(false);
  };

  const removeMember = (email) => setMembers(members.filter(m => m.email !== email));

  const handleCreate = async () => {
    if (!name || !budget) { Alert.alert('Error', 'Please fill all fields'); return; }
    setLoading(true);
    try {
      await createTrip({ 
        trip_name: name, 
        budget: parseFloat(budget), 
        currency: currency.code,
        start_date: startDate.toISOString().split('T')[0], 
        end_date: endDate.toISOString().split('T')[0], 
        members 
      });
      Alert.alert('Success', 'Trip created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', e); }
    finally { setLoading(false); }
  };

  const onDateChange = (event, selectedDate, type) => {
    if (type === 'start') { setShowStartPicker(Platform.OS === 'ios'); if (selectedDate) setStartDate(selectedDate); }
    else { setShowEndPicker(Platform.OS === 'ios'); if (selectedDate) setEndDate(selectedDate); }
  };

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
          <Text style={styles.headerSub}>NEW</Text>
          <Text style={styles.headerTitle}>Create Trip</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Input label="Trip Name" icon="airplane-outline" placeholder="e.g. Goa Vacation" value={name} onChangeText={setName} />
        <Input label={`Budget (${currency.symbol})`} icon="wallet-outline" placeholder="e.g. 50000" keyboardType="numeric" value={budget} onChangeText={setBudget} />
        
        {/* Currency Selector */}
        <Text style={styles.label}>Currency</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCurrencyModal(true)}>
          <Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{currency.name} ({currency.code})</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartPicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, 'start')} />}

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showEndPicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, 'end')} minimumDate={startDate} />}

        {/* Members */}
        <View style={styles.membersHeader}>
          <Text style={styles.label}>Members ({members.length})</Text>
          <TouchableOpacity onPress={() => setShowMemberModal(true)}>
            <Text style={styles.addMemberText}>+ Add Member</Text>
          </TouchableOpacity>
        </View>

        {members.length > 0 ? members.map((m, i) => (
          <View key={i} style={styles.memberChip}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
            </View>
            <TouchableOpacity onPress={() => removeMember(m.email)}>
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )) : (
          <Text style={styles.noMembers}>No members added yet</Text>
        )}

        <Button title="Create Trip" onPress={handleCreate} isLoading={loading} style={{ marginTop: 24, marginBottom: 40 }} />
      </ScrollView>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCurrencyModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem} 
                  onPress={() => { setCurrency(item); setShowCurrencyModal(false); }}
                >
                  <Text style={styles.modalItemText}>{item.name} ({item.code}) - {item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showMemberModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowMemberModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Member</Text>
            <Input label="Name" icon="person-outline" placeholder="Enter name" value={newMemberName} onChangeText={setNewMemberName} />
            <Input label="Email" icon="mail-outline" placeholder="Enter email" value={newMemberEmail} onChangeText={setNewMemberEmail} autoCapitalize="none" keyboardType="email-address" />
            <Button title="Add Member" onPress={addMember} style={{ marginTop: 8 }} />
            <Button title="Cancel" variant="ghost" onPress={() => setShowMemberModal(false)} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
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
  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 120 },
  label: { fontSize: SIZES.caption, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 8, marginTop: 12, letterSpacing: 0.3 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, height: 52, paddingHorizontal: 16, marginBottom: 4 },
  dateText: { fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.textPrimary },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  addMemberText: { color: COLORS.primaryLight, fontFamily: FONTS.semiBold, fontSize: SIZES.bodySmall },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: SIZES.radius, padding: 12, marginBottom: 8 },
  memberAvatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading, color: COLORS.primaryLight },
  memberName: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  memberEmail: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  noMembers: { color: COLORS.textTertiary, fontFamily: FONTS.regular, fontStyle: 'italic', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundElevated, borderTopLeftRadius: SIZES.radiusXL, borderTopRightRadius: SIZES.radiusXL, padding: 20, minHeight: 380 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { fontSize: SIZES.body, fontFamily: FONTS.medium, color: COLORS.textPrimary },
});

export default CreateTripScreen;
