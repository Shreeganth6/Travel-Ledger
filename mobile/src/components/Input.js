import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, GLASS } from '../constants/theme';

const Input = ({
  label,
  icon,
  error,
  password,
  onFocus = () => { },
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(password);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={SIZES.iconSmall}
            color={isFocused ? COLORS.primaryLight : COLORS.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          secureTextEntry={hidePassword}
          autoCorrect={false}
          onFocus={() => {
            onFocus();
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          placeholderTextColor={COLORS.textTertiary}
          textAlignVertical="center"
          {...props}
        />

        {password && (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
              size={SIZES.iconSmall}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={13} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.3,
  },
  inputContainer: {
    height: SIZES.inputHeight,
    backgroundColor: COLORS.glass,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  icon: {
    marginRight: 12,
  },
  iconButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.caption,
    marginLeft: 4,
    fontFamily: FONTS.regular,
  },
});

export default Input;
