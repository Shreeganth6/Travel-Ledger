import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, SPACING } from '../constants/theme';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
} from '../api/notifications';

const TYPE_META = {
  expense_added: { icon: 'add-circle', color: COLORS.success, bg: 'rgba(52,211,153,0.15)' },
  expense_deleted: { icon: 'trash', color: COLORS.error, bg: 'rgba(248,113,113,0.15)' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err) { console.log('Notification error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const handleMarkRead = async (item) => {
    if (item.is_read) return;
    try {
      await markNotificationRead(item.notification_id);
      setNotifications(prev => prev.map(n => n.notification_id === item.notification_id ? { ...n, is_read: 1 } : n));
    } catch (err) { console.log('Mark read error:', err); }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { Alert.alert('Error', 'Could not mark all as read.'); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }) => {
    const meta = TYPE_META[item.type] || TYPE_META.expense_added;
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => handleMarkRead(item)}
        style={[styles.card, !item.is_read && styles.cardUnread]}
      >
        {!item.is_read && <View style={styles.unreadAccent} />}
        <Ionicons name={meta.icon} size={28} color={meta.color} style={{ marginRight: 16, marginLeft: 12 }} />
        <View style={styles.textWrap}>
          <Text style={styles.tripName}>{item.trip_name}</Text>
          <Text style={[styles.message, !item.is_read && styles.messageUnread]}>{item.message}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerSub}>UPDATES</Text>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll} style={styles.markAllBtn}>
            {markingAll
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Text style={styles.markAllText}>Read all</Text>
            }
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {/* Unread banner */}
      {unreadCount > 0 && (
        <View style={styles.banner}>
          <View style={styles.bannerDot} />
          <Text style={styles.bannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.notification_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>You'll be notified when expenses are added or deleted.</Text>
            </View>
          }
        />
      )}
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
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusFull, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  markAllText: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.primaryLight },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(99,102,241,0.1)', marginHorizontal: SIZES.paddingLarge,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radiusSmall,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  bannerText: { fontSize: SIZES.caption, fontFamily: FONTS.medium, color: COLORS.primaryLight },

  list: { paddingHorizontal: SIZES.paddingLarge, paddingBottom: 100, paddingTop: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder,
    borderRadius: SIZES.radius, padding: 14, marginBottom: 10, overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardUnread: { borderColor: 'rgba(99,102,241,0.3)' },
  unreadAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: COLORS.primary },
  textWrap: { flex: 1 },
  tripName: { fontSize: SIZES.tiny, fontFamily: FONTS.semiBold, color: COLORS.primaryLight, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  message: { fontSize: SIZES.bodySmall, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 3 },
  messageUnread: { fontFamily: FONTS.medium, color: COLORS.textPrimary },
  time: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textTertiary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8, ...SHADOWS.glow },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { fontSize: SIZES.h4, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  emptySubText: { fontSize: SIZES.caption, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
});

export default NotificationsScreen;
