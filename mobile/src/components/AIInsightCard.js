import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

const AIInsightCard = ({ insight }) => {
  if (!insight) return null;

  const hasAnomaly = insight.anomaly_detected;
  const isWarning = insight.status === 'WARNING' || insight.is_over_budget;
  const isCritical = insight.status === 'CRITICAL';

  const getAccentColor = () => {
    if (isCritical) return COLORS.error;
    if (hasAnomaly) return COLORS.warning;
    if (isWarning) return COLORS.warning;
    return COLORS.success;
  };

  const getEmoji = () => {
    if (isCritical) return '🚨';
    if (hasAnomaly) return '🔍';
    if (isWarning) return '⚠️';
    return '✅';
  };

  const accent = getAccentColor();

  return (
    <View style={[styles.card, { borderColor: `${accent}50` }]}>
      {/* Subtle gradient background strip */}
      <LinearGradient
        colors={[`${accent}20`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientStrip}
      />

      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${accent}20`, borderColor: `${accent}40` }]}>
          <Text style={styles.emoji}>{getEmoji()}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>AI Budget Analysis</Text>
          <Text style={[styles.statusText, { color: accent }]}>
            {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : hasAnomaly ? 'ANOMALY DETECTED' : 'ON TRACK'}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.label}>Predicted Total</Text>
        <Text style={[styles.amount, { color: accent }]}>
          ₹{insight.forecast_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {hasAnomaly && (
        <View style={[styles.alertBox, { borderLeftColor: COLORS.warning, backgroundColor: 'rgba(251,191,36,0.08)' }]}>
          <Text style={[styles.alertText, { color: COLORS.warning }]}>
            <Text style={styles.alertBold}>UNUSUAL SPENDING: </Text>
            We detected a spike that doesn't match your typical patterns.
          </Text>
        </View>
      )}

      {isWarning && !isCritical && (
        <View style={[styles.alertBox, { borderLeftColor: COLORS.warning, backgroundColor: 'rgba(251,191,36,0.08)' }]}>
          <Text style={[styles.alertText, { color: COLORS.warning }]}>
            At this rate, you will exceed your trip budget!
          </Text>
        </View>
      )}

      {isCritical && (
        <View style={[styles.alertBox, { borderLeftColor: COLORS.error, backgroundColor: 'rgba(248,113,113,0.08)' }]}>
          <Text style={[styles.alertText, { color: COLORS.error }]}>
            CRITICAL: You are projected to significantly overspend!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradientStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.body,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusText: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  amountRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  alertBox: {
    padding: 12,
    borderRadius: SIZES.radiusSmall,
    borderLeftWidth: 3,
    marginTop: 8,
  },
  alertText: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  alertBold: {
    fontFamily: FONTS.bold,
  },
});

export default AIInsightCard;