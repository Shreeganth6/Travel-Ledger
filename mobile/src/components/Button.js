import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES, FONTS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  isLoading = false,
  variant = 'primary', // primary, secondary, outline, ghost, glass
  size = 'large',
  style,
  textStyle,
  icon,
}) => {
  const getHeight = () => {
    if (size === 'small') return SIZES.buttonHeightSmall;
    if (size === 'medium') return 48;
    return SIZES.buttonHeight;
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isGlass = variant === 'glass';

  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[styles.container, { height: getHeight() }, style]}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[styles.text, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[styles.container, { height: getHeight() }, style]}
      >
        <LinearGradient
          colors={COLORS.gradientSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[styles.text, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (isGlass) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[styles.container, styles.glass, { height: getHeight() }, style]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={[styles.text, styles.glassText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
      style={[
        styles.container,
        { height: getHeight() },
        isOutline && styles.outline,
        isGhost && styles.ghost,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isOutline || isGhost ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={[
          styles.text,
          (isOutline || isGhost) && styles.outlineText,
          textStyle,
        ]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  ghost: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  glass: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineText: {
    color: COLORS.primary,
  },
  glassText: {
    color: COLORS.primaryLight,
  },
});

export default Button;
