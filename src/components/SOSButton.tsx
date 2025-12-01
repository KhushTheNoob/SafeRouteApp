import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, fontSizes } from '../config/theme';

interface SOSButtonProps {
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onPress,
  isActive = false,
  disabled = false,
  size = 'large',
}) => {
  const buttonSize = size === 'large' ? 72 : size === 'medium' ? 56 : 44;
  const iconSize = size === 'large' ? 32 : size === 'medium' ? 24 : 20;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        isActive && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.innerCircle}>
        <MaterialCommunityIcons
          name={isActive ? 'phone-cancel' : 'alert'}
          size={iconSize}
          color={colors.textPrimary}
        />
        <Text style={[styles.label, size === 'small' && styles.labelSmall]}>
          {isActive ? 'CANCEL' : 'SOS'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.sosRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  buttonActive: {
    backgroundColor: colors.warning,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  labelSmall: {
    fontSize: fontSizes.xs,
  },
});

export default SOSButton;
