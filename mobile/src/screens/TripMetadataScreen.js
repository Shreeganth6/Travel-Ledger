import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Input from '../components/Input';
import { getTripById, updateTripStatus } from '../api/trips';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_COLORS = ['#6366F1', '#A855F7', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

const TripMetadataScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const { userInfo } = useContext(AuthContext);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [adding, setAdding] = useState(false);
  const [ending, setEnding] = useState(false);

  const fetchDetails = async () => {
    try { const data = await getTripById(tripId); setTripData(data); }
    catch (e) { console.log('Error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [tripId]);

  const handleEndTrip = async () => {
    Alert.alert(
      "End Trip",
      "Are you sure you want to end this trip? You won't be able to add more expenses.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Trip", 
          style: "destructive",
          onPress: async () => {
            setEnding(true);
            try {
              await updateTripStatus(tripId, 'done');
              Alert.alert('Success', 'Trip marked as completed!');
              fetchDetails();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to end trip');
            } finally {
              setEnding(false);
            }
          }
        }
      ]
    );
  };

  const handleAddMember = async () => {
    if (!newMemberEmail) { Alert.alert('Error', 'Please enter email'); return; }
    setAdding(true);
    try {
      await api.post(`/trips/${tripId}/members`, { email: newMemberEmail, name: newMemberName });
      Alert.alert('Success', 'Member added!');
      setShowAddMember(false); setNewMemberEmail(''); setNewMemberName('');
      fetchDetails();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to add'); }
    finally { setAdding(false); }
  };

  if (loading) return <Loader />;
  if (!tripData) return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <Text style={{ color: COLORS.textPrimary, textAlign: 'center', marginTop: 100 }}>Error loading details</Text>
    </View>
  );

  const { trip, members } = tripData;

  const infoItems = [
    { icon: 'airplane', label: 'Trip Name', value: trip.trip_name },
    { icon: 'wallet', label: 'Budget', value: `₹${Number(trip.budget).toLocaleString()}` },
    { icon: 'calendar', label: 'Duration', value: `${new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` },
    { icon: 'person', label: 'Created By', value: members.find(m => m.role === 'admin')?.full_name || 'Admin' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0F1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
      <View style={styles.bgOrb} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>INFO</Text>
          <Text style={styles.headerTitle}>Trip Details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Trip Info Card */}
        <View style={[styles.infoCard, GLASS.cardStrong]}>
          {infoItems.map((item, i) => (
            <View key={i} style={[styles.infoRow, i < infoItems.length - 1 && styles.infoBorder]}>
              <Ionicons name={item.icon} size={22} color={COLORS.primaryLight} style={{ marginRight: 16 }} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Members */}
        <View style={styles.membersHeader}>
          <Text style={styles.sectionLabel}>MEMBERS ({members.length})</Text>
          {trip.status !== 'done' && (
            <TouchableOpacity onPress={() => setShowAddMember(true)}>
              <Text style={styles.addMemberText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.membersCard, GLASS.cardStrong]}>
          {members.map((member, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <View key={member.user_id} style={[styles.memberRow, i < members.length - 1 && styles.memberBorder]}>
                <View style={[styles.memberAvatar, { backgroundColor: `${color}25`, borderColor: `${color}50` }]}>
                  <Text style={[styles.memberAvatarText, { color }]}>{member.full_name.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  <Text style={styles.memberEmail}>{member.email || 'No email'}</Text>
                </View>
                {member.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={COLORS.primaryLight} />
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
 
        {/* End Trip for Admins */}
        {trip.status !== 'done' && members.find(m => m.user_id === userInfo?.user_id)?.role === 'admin' && (
          <Button 
            title="End Trip" 
            onPress={handleEndTrip} 
            isLoading={ending} 
            style={styles.endBtn} 
            variant="outline"
          />
        )}
 
        {trip.status === 'done' && (
          <View style={styles.doneBanner}>
            <Ionicons name="checkmark-done-circle" size={24} color={COLORS.success} />
            <Text style={styles.doneText}>This trip is completed</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Member Modal */}
      <Modal visible={showAddMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddMember(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Member</Text>
            <Input label="Email" icon="mail-outline" placeholder="friend@example.com" value={newMemberEmail} onChangeText={setNewMemberEmail} autoCapitalize="none" />
            <Input label="Name (Optional)" icon="person-outline" placeholder="John Doe" value={newMemberName} onChangeText={setNewMemberName} />
            <Button title="Add Member" onPress={handleAddMember} isLoading={adding} style={{ marginTop: 8 }} />
            <Button title="Cancel" variant="ghost" onPress={() => setShowAddMember(false)} style={{ marginTop: 10 }} />
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
  content: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 40 },

  infoCard: { borderRadius: SIZES.radiusLarge, padding: 20, marginBottom: 24, ...SHADOWS.medium },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoText: { flex: 1 },
  infoLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },

  sectionLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.textTertiary, letterSpacing: 1.5 },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addMemberText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },

  membersCard: { borderRadius: SIZES.radiusLarge, padding: 16, ...SHADOWS.medium },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  memberAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading },
  memberInfo: { flex: 1 },
  memberName: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary, marginBottom: 2 },
  memberEmail: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  adminText: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },

  endBtn: { marginTop: 24, borderColor: COLORS.error, borderWidth: 1.5 },
  doneBanner: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: SIZES.radiusLarge, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  doneText: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.success },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundElevated, borderTopLeftRadius: SIZES.radiusXL, borderTopRightRadius: SIZES.radiusXL, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
});

export default TripMetadataScreen;
