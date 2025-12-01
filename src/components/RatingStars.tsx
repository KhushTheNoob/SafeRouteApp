import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, borderRadius } from '../config/theme';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
  label?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 24,
  editable = false,
  onRatingChange,
  label,
}) => {
  const handlePress = (index: number) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const stars = [];
  for (let i = 0; i < maxRating; i++) {
    const isFilled = i < rating;
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => handlePress(i)}
        disabled={!editable}
        activeOpacity={editable ? 0.7 : 1}
      >
        <MaterialCommunityIcons
          name={isFilled ? 'star' : 'star-outline'}
          size={size}
          color={isFilled ? colors.warning : colors.textMuted}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.starsContainer}>{stars}</View>
      {editable && (
        <Text style={styles.ratingText}>
          {rating} / {maxRating}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default RatingStars;
