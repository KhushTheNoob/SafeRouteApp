import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../config/theme';

interface SafetyScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const SafetyScoreBadge: React.FC<SafetyScoreBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {
  const getScoreColor = () => {
    if (score >= 70) return colors.success;
    if (score >= 40) return colors.warning;
    return colors.danger;
  };

  const getScoreLabel = () => {
    if (score >= 70) return 'Safe';
    if (score >= 40) return 'Moderate';
    return 'Use Caution';
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48 };
      case 'large':
        return { width: 80, height: 80 };
      default:
        return { width: 64, height: 64 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return fontSizes.lg;
      case 'large':
        return fontSizes.xxxl;
      default:
        return fontSizes.xxl;
    }
  };

  const badgeSize = getBadgeSize();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            ...badgeSize,
            borderRadius: badgeSize.width / 2,
            borderColor: getScoreColor(),
          },
        ]}
      >
        <Text style={[styles.score, { fontSize: getFontSize(), color: getScoreColor() }]}>
          {score}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: getScoreColor() }]}>
          {getScoreLabel()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 3,
  },
  score: {
    fontWeight: '700',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});

export default SafetyScoreBadge;
