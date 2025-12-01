import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontSizes, spacing } from '../config/theme';
import { APP_NAME } from '../config/constants';

interface MapHeaderProps {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
}

export const MapHeader: React.FC<MapHeaderProps> = ({
  onMenuPress,
  onProfilePress,
  showBackButton = false,
  onBackPress,
  title,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <MaterialCommunityIcons
              name="menu"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleContainer}>
        <MaterialCommunityIcons
          name="shield-check"
          size={24}
          color={colors.primary}
        />
        <Text style={styles.title}>{title || APP_NAME}</Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
          <MaterialCommunityIcons
            name="account-circle"
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconButton: {
    padding: spacing.xs,
  },
});

export default MapHeader;
