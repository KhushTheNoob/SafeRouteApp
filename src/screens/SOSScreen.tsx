import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MapHeader, SOSButton, Button } from '../components';
import { useSOS, useLocation } from '../hooks';
import { colors, fontSizes, spacing, borderRadius, MAP_DEFAULT_DELTA, SOS_COOLDOWN_MS } from '../config';
import { RootStackParamList } from '../types';

type SOSScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SOS'>;

export const SOSScreen: React.FC = () => {
  const navigation = useNavigation<SOSScreenNavigationProp>();
  const {
    isActive,
    currentAlert,
    canCancel,
    activateSOS,
    deactivateSOS,
    updateLocation,
    getRemainingCooldown,
  } = useSOS();

  const { currentLocation, startTracking, stopTracking } = useLocation();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Vibrate pattern for SOS
  useEffect(() => {
    if (isActive) {
      // SOS vibration pattern (... --- ...)
      Vibration.vibrate([0, 200, 100, 200, 100, 200, 300, 400, 200, 400, 200, 400, 300, 200, 100, 200, 100, 200]);
    }
  }, [isActive]);

  // Start location tracking when SOS is active
  useEffect(() => {
    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isActive, startTracking, stopTracking]);

  // Update SOS location when user moves
  useEffect(() => {
    if (isActive && currentLocation) {
      updateLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [isActive, currentLocation, updateLocation]);

  // Cooldown timer
  useEffect(() => {
    if (!canCancel && isActive) {
      const interval = setInterval(() => {
        const remaining = getRemainingCooldown();
        setCooldownRemaining(remaining);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [canCancel, isActive, getRemainingCooldown]);

  // Elapsed time counter
  useEffect(() => {
    if (isActive && currentAlert) {
      const interval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - currentAlert.timestamp) / 1000);
        setElapsed(elapsedTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive, currentAlert]);

  // Handle cancel SOS
  const handleCancel = useCallback(async () => {
    if (!canCancel) {
      Alert.alert(
        'Please Wait',
        `You can cancel in ${Math.ceil(cooldownRemaining / 1000)} seconds.`
      );
      return;
    }

    Alert.alert(
      'Cancel SOS',
      'Are you sure you want to cancel the SOS alert?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const success = await deactivateSOS();
            if (success) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [canCancel, cooldownRemaining, deactivateSOS, navigation]);

  // Format elapsed time
  const formatElapsed = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        showBackButton
        onBackPress={() => navigation.goBack()}
        title="SOS Active"
      />

      <View style={styles.content}>
        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
          <Text style={styles.statusText}>
            {isActive ? 'SOS Alert Active' : 'SOS Inactive'}
          </Text>
        </View>

        {/* Elapsed time */}
        {isActive && (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={24}
              color={colors.sosRed}
            />
            <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
          </View>
        )}

        {/* Map showing current location */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            followsUserLocation
            region={
              currentLocation
                ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }
                : undefined
            }
          />
        </View>

        {/* Info cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="broadcast"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.infoTitle}>Live Location</Text>
            <Text style={styles.infoText}>
              Your location is being shared with trusted contacts
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="bell-ring"
              size={24}
              color={colors.warning}
            />
            <Text style={styles.infoTitle}>Contacts Notified</Text>
            <Text style={styles.infoText}>
              {currentAlert?.notifiedContacts.length || 0} contacts have been alerted
            </Text>
          </View>
        </View>

        {/* Cancel button */}
        <View style={styles.cancelContainer}>
          {!canCancel && isActive && (
            <Text style={styles.cooldownText}>
              Cancel available in {Math.ceil(cooldownRemaining / 1000)}s
            </Text>
          )}

          <SOSButton
            onPress={handleCancel}
            isActive={true}
            disabled={!canCancel}
            size="large"
          />

          <Text style={styles.cancelHint}>
            {canCancel ? 'Tap to cancel SOS' : 'Please wait...'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: colors.sosRed,
  },
  statusText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timerText: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: colors.sosRed,
  },
  mapContainer: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cancelContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  cooldownText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  cancelHint: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

export default SOSScreen;
