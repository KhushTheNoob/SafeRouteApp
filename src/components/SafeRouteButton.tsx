import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, fontSizes, spacing } from '../config/theme';

interface SafeRouteButtonProps {
  onPress: () => void;
  label?: string;
  style?: object;
}

export const SafeRouteButton: React.FC<SafeRouteButtonProps> = ({
  onPress,
  label = 'Plan Safe Route',
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name="map-marker-path"
        size={20}
        color={colors.textPrimary}
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
    ...shadows.medium,
  },
  label: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default SafeRouteButton;
