import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapHeader, Button } from '../components';
import { colors, fontSizes, spacing, borderRadius, shadows, mapDarkStyle } from '../config';
import { RootStackParamList, TrustedContact, Coordinates } from '../types';
import { useWalkWithMe, useLocation } from '../hooks';
import { getTrustedContacts } from '../services/contactService';
import { formatDistance, formatDuration } from '../utils';

const { width, height } = Dimensions.get('window');

type WalkWithMeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const WalkWithMeScreen: React.FC = () => {
  const navigation = useNavigation<WalkWithMeNavigationProp>();
  const { location, error: locationError, getCurrentLocation, requestPermission } = useLocation();
  const {
    session,
    isActive,
    startSession,
    endSession,
    updateLocation,
    isLoading,
  } = useWalkWithMe();

  const mapRef = useRef<MapView>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [routePath, setRoutePath] = useState<Coordinates[]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Fetch location on mount
  useEffect(() => {
    const initLocation = async () => {
      setIsLoadingLocation(true);
      try {
        await requestPermission();
        await getCurrentLocation();
      } catch (error) {
        console.error('Failed to get location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    initLocation();
  }, []);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await getTrustedContacts();
        // Show all contacts, not just verified ones (since we're in local mode)
        setContacts(data);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      }
    };

    loadContacts();
  }, []);

  // Update location when walking
  useEffect(() => {
    if (isActive && location) {
      updateLocation(location);
    }
  }, [isActive, location, updateLocation]);

  // Calculate distance and ETA
  useEffect(() => {
    if (location && destination) {
      const distance = calculateDistance(location, destination);
      // Assuming average walking speed of 5 km/h
      const walkingSpeedKmH = 5;
      const etaMinutes = (distance / 1000 / walkingSpeedKmH) * 60;
      setEta(Math.round(etaMinutes));
    }
  }, [location, destination]);

  // Haversine formula for distance
  const calculateDistance = (start: Coordinates, end: Coordinates): number => {
    const R = 6371e3;
    const φ1 = (start.latitude * Math.PI) / 180;
    const φ2 = (end.latitude * Math.PI) / 180;
    const Δφ = ((end.latitude - start.latitude) * Math.PI) / 180;
    const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Handle map press for destination
  const handleMapPress = useCallback(
    (event: any) => {
      if (!isActive && showDestinationModal) {
        const { coordinate } = event.nativeEvent;
        setDestination(coordinate);
      }
    },
    [isActive, showDestinationModal]
  );

  // Start walk session
  const handleStartWalk = useCallback(async () => {
    if (!destination) {
      Alert.alert('Error', 'Please set a destination first');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact to notify');
      return;
    }

    // Try to get location if not available
    let currentLoc = location;
    if (!currentLoc) {
      setIsLoadingLocation(true);
      try {
        currentLoc = await getCurrentLocation();
      } finally {
        setIsLoadingLocation(false);
      }
    }

    if (!currentLoc) {
      Alert.alert(
        'Location Required',
        'Unable to get your current location. Please make sure:\n\n• GPS/Location is enabled in device settings\n• Location permission is granted for Expo Go\n\nThen tap "Retry".',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: async () => {
              setIsLoadingLocation(true);
              const loc = await getCurrentLocation();
              setIsLoadingLocation(false);
              if (loc) {
                // Retry starting walk
                handleStartWalk();
              }
            }
          },
        ]
      );
      return;
    }

    try {
      // Get contacts from the contactService
      const selectedContactsObjects = contacts.filter(c => selectedContacts.includes(c.id));
      
      // Create location with timestamp
      const locationWithTimestamp = {
        ...currentLoc,
        timestamp: currentLoc.timestamp || Date.now(),
      };
      
      await startSession(destination, destinationName || 'Destination', selectedContactsObjects, locationWithTimestamp);

      // Create path from current location to destination
      setRoutePath([currentLoc, destination]);

      Alert.alert(
        'Walk With Me Started',
        'Your selected contacts will be notified about your walk.'
      );
    } catch (error) {
      console.error('Start walk error:', error);
      Alert.alert('Error', 'Failed to start walk session. Please try again.');
    }
  }, [destination, destinationName, selectedContacts, contacts, location, startSession, getCurrentLocation]);

  // End walk session
  const handleEndWalk = useCallback(async () => {
    Alert.alert(
      'End Walk',
      'Are you sure you want to end this walk session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Walk',
          style: 'destructive',
          onPress: async () => {
            try {
              await endSession();
              setDestination(null);
              setDestinationName('');
              setSelectedContacts([]);
              setRoutePath([]);
              setEta(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to end walk session');
            }
          },
        },
      ]
    );
  }, [endSession]);

  // Toggle contact selection
  const toggleContact = useCallback((contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  // Render contact selection item
  const renderContactItem = useCallback(
    ({ item }: { item: TrustedContact }) => {
      const isSelected = selectedContacts.includes(item.id);
      return (
        <TouchableOpacity
          style={[styles.contactItem, isSelected && styles.contactItemSelected]}
          onPress={() => toggleContact(item.id)}
        >
          <View style={styles.contactItemInfo}>
            <View style={styles.contactAvatar}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <View>
              <Text style={styles.contactItemName}>{item.name}</Text>
              <Text style={styles.contactItemPhone}>{item.phoneNumber}</Text>
            </View>
          </View>
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}
          >
            {isSelected && (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.white}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedContacts, toggleContact]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        title="Walk With Me"
        onMenuPress={() => {}}
        onProfilePress={() => {}}
      />

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapDarkStyle}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : undefined
          }
          onPress={handleMapPress}
        >
          {/* Destination marker */}
          {destination && (
            <Marker
              coordinate={destination}
              title={destinationName || 'Destination'}
            >
              <View style={styles.destinationMarker}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={24}
                  color={colors.primary}
                />
              </View>
            </Marker>
          )}

          {/* Route path */}
          {routePath.length >= 2 && (
            <Polyline
              coordinates={routePath}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineDashPattern={[10, 5]}
            />
          )}
        </MapView>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {isActive && session ? (
          // Active session view
          <View style={styles.activeSession}>
            <View style={styles.sessionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.sessionDestination}>
                Walking to: {session.destinationName}
              </Text>
            </View>

            <View style={styles.statsRow}>
              {/* ETA */}
              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>
                  {eta !== null ? `${eta} min` : '--'}
                </Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>

              {/* Tracking contacts */}
              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color={colors.secondary}
                />
                <Text style={styles.statValue}>
                  {session.sharedWith?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Tracking</Text>
              </View>

              {/* Distance */}
              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={24}
                  color={colors.info}
                />
                <Text style={styles.statValue}>
                  {destination && location
                    ? formatDistance(calculateDistance(location, destination))
                    : '--'}
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            <Button
              title="End Walk"
              variant="danger"
              onPress={handleEndWalk}
              loading={isLoading}
            />
          </View>
        ) : (
          // Setup view
          <View style={styles.setupPanel}>
            {/* Destination */}
            <TouchableOpacity
              style={styles.setupField}
              onPress={() => setShowDestinationModal(true)}
            >
              <MaterialCommunityIcons
                name="flag-checkered"
                size={24}
                color={destination ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.setupFieldText,
                  destination && styles.setupFieldTextActive,
                ]}
              >
                {destinationName || (destination ? 'Destination set' : 'Set destination')}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Contacts */}
            <TouchableOpacity
              style={styles.setupField}
              onPress={() => setShowContactsModal(true)}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={selectedContacts.length > 0 ? colors.secondary : colors.textMuted}
              />
              <Text
                style={[
                  styles.setupFieldText,
                  selectedContacts.length > 0 && styles.setupFieldTextActive,
                ]}
              >
                {selectedContacts.length > 0
                  ? `${selectedContacts.length} contact(s) selected`
                  : 'Select contacts to notify'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <Button
              title={isLoadingLocation ? "Getting Location..." : "Start Walk"}
              onPress={handleStartWalk}
              loading={isLoading || isLoadingLocation}
              disabled={!destination || selectedContacts.length === 0 || isLoadingLocation}
            />
          </View>
        )}
      </View>

      {/* Destination Modal */}
      <Modal
        visible={showDestinationModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Destination</Text>
              <TouchableOpacity onPress={() => setShowDestinationModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.destinationInput}
              placeholder="Enter destination name"
              placeholderTextColor={colors.textMuted}
              value={destinationName}
              onChangeText={setDestinationName}
            />

            <Text style={styles.modalHint}>
              Tap on the map to set your destination
            </Text>

            <MapView
              style={styles.modalMap}
              provider={PROVIDER_GOOGLE}
              customMapStyle={mapDarkStyle}
              showsUserLocation
              initialRegion={
                location
                  ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }
                  : undefined
              }
              onPress={(e) => setDestination(e.nativeEvent.coordinate)}
            >
              {destination && (
                <Marker coordinate={destination}>
                  <View style={styles.destinationMarker}>
                    <MaterialCommunityIcons
                      name="flag-checkered"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                </Marker>
              )}
            </MapView>

            <Button
              title="Confirm Destination"
              onPress={() => setShowDestinationModal(false)}
              disabled={!destination}
            />
          </View>
        </View>
      </Modal>

      {/* Contacts Modal */}
      <Modal
        visible={showContactsModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contacts</Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              These contacts will be able to track your walk in real-time
            </Text>

            <FlatList
              data={contacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              ListEmptyComponent={
                <View style={styles.emptyContacts}>
                  <MaterialCommunityIcons
                    name="account-alert-outline"
                    size={48}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyContactsText}>
                    No verified contacts with tracking enabled
                  </Text>
                </View>
              }
            />

            <Button
              title={`Done (${selectedContacts.length} selected)`}
              onPress={() => setShowContactsModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  destinationMarker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    ...shadows.medium,
  },
  controlPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.large,
  },
  activeSession: {
    gap: spacing.md,
  },
  sessionHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.danger + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  liveText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.danger,
  },
  sessionDestination: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  setupPanel: {
    gap: spacing.md,
  },
  setupField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  setupFieldText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  setupFieldTextActive: {
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalHint: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  destinationInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalMap: {
    height: 300,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  contactsList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactItemSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  contactItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItemName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactItemPhone: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyContacts: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyContactsText: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default WalkWithMeScreen;
