import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, GLASS, SHADOWS } from '../constants/theme';

const EmptyState = ({ message = 'Nothing here yet', icon = 'folder-open-outline' }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={COLORS.primaryLight} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.sub}>Pull down to refresh</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.small,
  },
  message: {
    fontSize: SIZES.body,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default EmptyState;
