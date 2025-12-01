import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Report, REPORT_CATEGORY_CONFIG } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../config/theme';
import { formatTimeSince, formatDistance } from '../utils';

interface ReportCardProps {
  report: Report;
  distanceKm?: number;
  onPress?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  distanceKm,
  onPress,
  onUpvote,
  onDownvote,
}) => {
  const categoryConfig = REPORT_CATEGORY_CONFIG[report.category];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryConfig.color }]}>
          <MaterialCommunityIcons
            name={categoryConfig.icon as any}
            size={20}
            color={colors.textPrimary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.category}>{categoryConfig.label}</Text>
          <Text style={styles.time}>{formatTimeSince(report.createdAt)}</Text>
        </View>
        {distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.distanceText}>{formatDistance(distanceKm)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{report.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {report.description}
      </Text>

      {report.imageUrl && (
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={onUpvote}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="thumb-up-outline"
            size={18}
            color={colors.success}
          />
          <Text style={styles.voteCount}>{report.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteButton}
          onPress={onDownvote}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="thumb-down-outline"
            size={18}
            color={colors.danger}
          />
          <Text style={styles.voteCount}>{report.downvotes}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  category: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  distanceText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voteCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default ReportCard;
