import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES, FONTS, SHADOWS, GLASS } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { getTripById } from '../api/trips';
import { searchUsers, addMember } from '../api/users';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_COLORS = ['#6366F1', '#A855F7', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

const MembersScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const [members, setMembers] = useState([]);
  const [tripStatus, setTripStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchMembers = async () => {
    try {
      const data = await getTripById(tripId);
      setMembers(data.members);
      if (data.trip) setTripStatus(data.trip.status);
    } catch (e) { console.log('Members error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [tripId]);

  const handleSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    const results = await searchUsers(searchEmail);
    const filtered = results.filter(u => !members.find(m => m.user_id === u.user_id));
    setSearchResults(filtered);
    setSearching(false);
  };

  const handleAddMember = async (user) => {
    try {
      await addMember(tripId, user.user_id);
      Alert.alert('Success', `${user.full_name} added to trip!`);
      setShowAddModal(false);
      setSearchEmail('');
      setSearchResults([]);
      fetchMembers();
    } catch (e) { Alert.alert('Error', e); }
  };

  const renderMember = ({ item, index }) => {
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return (
      <View style={styles.memberCard}>
        <View style={[styles.avatar, { backgroundColor: `${color}25`, borderColor: `${color}50` }]}>
          <Text style={[styles.avatarText, { color }]}>{item.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={styles.roleRow}>
            {item.role === 'admin' && <Ionicons name="shield-checkmark" size={12} color={COLORS.primaryLight} style={{ marginRight: 4 }} />}
            <Text style={[styles.role, item.role === 'admin' && { color: COLORS.primaryLight }]}>{item.role}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textTertiary} />
      </View>
    );
  };

  if (loading) return <Loader />;

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
          <Text style={styles.headerSub}>TEAM</Text>
          <Text style={styles.headerTitle}>Members ({members.length})</Text>
        </View>
        {tripStatus !== 'done' && (
          <TouchableOpacity style={styles.addBtnWrap} onPress={() => setShowAddModal(true)}>
            <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
              <Ionicons name="person-add" size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Member Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Member</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input placeholder="Search by email..." value={searchEmail} onChangeText={setSearchEmail} autoCapitalize="none" />
              </View>
              <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                <Ionicons name="search" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {searching && <Loader />}

            <FlatList
              data={searchResults}
              keyExtractor={item => item.user_id.toString()}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchItem} onPress={() => handleAddMember(item)}>
                  <View style={styles.searchAvatar}>
                    <Text style={styles.searchAvatarText}>{item.full_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchItemName}>{item.full_name}</Text>
                    <Text style={styles.searchItemEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={COLORS.primaryLight} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={!searching && searchEmail.length > 0 && <Text style={styles.emptyText}>No users found</Text>}
            />
            <Button title="Close" variant="ghost" onPress={() => setShowAddModal(false)} style={{ marginTop: 10 }} />
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
  addBtnWrap: { ...SHADOWS.colored },
  addGradient: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 10, ...SHADOWS.small,
  },
  avatar: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: SIZES.h4, fontFamily: FONTS.heading },
  info: { flex: 1 },
  name: { fontSize: SIZES.body, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 2 },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  role: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary, textTransform: 'capitalize' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.backgroundElevated, borderTopLeftRadius: SIZES.radiusXL, borderTopRightRadius: SIZES.radiusXL, padding: 20, minHeight: 400 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.heading, color: COLORS.textLight, marginBottom: 16, textAlign: 'center' },
  searchBtn: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginTop: -16 },
  searchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  searchAvatarText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.heading, color: COLORS.primaryLight },
  searchItemName: { fontSize: SIZES.body, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  searchItemEmail: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.textSecondary, fontFamily: FONTS.regular },
});

export default MembersScreen;
