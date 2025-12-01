import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, fontSizes, spacing } from '../config/theme';

interface ReportButtonProps {
  onPress: () => void;
  label?: string;
  style?: object;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  onPress,
  label = 'Report Issue',
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name="alert-circle-outline"
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
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
    ...shadows.medium,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default ReportButton;
