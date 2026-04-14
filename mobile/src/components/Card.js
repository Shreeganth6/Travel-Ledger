import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES, GLASS } from '../constants/theme';

const Card = ({
  children,
  style,
  gradient = false,
  gradientColors,
  glass = true,
  strong = false,
}) => {
  if (gradient) {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={gradientColors || COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  const glassStyle = strong ? GLASS.cardStrong : GLASS.card;

  return (
    <View style={[styles.container, glassStyle, styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusLarge,
    marginBottom: SIZES.margin,
    overflow: 'hidden',
  },
  card: {
    padding: SIZES.padding,
    ...SHADOWS.medium,
  },
  gradientCard: {
    padding: SIZES.padding,
    ...SHADOWS.colored,
  },
});

export default Card;
