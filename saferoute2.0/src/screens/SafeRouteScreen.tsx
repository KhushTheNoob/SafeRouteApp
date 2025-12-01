import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from 'react-native-maps';

import { MapHeader, Button, SafetyScoreBadge } from '../components';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../config';
import { RootStackParamList, SafeRoute, Coordinates } from '../types';
import { useLocation } from '../hooks';
import { findSafeRoute } from '../services/routeService';
import { formatDistance, formatDuration } from '../utils';

// Custom map style for dark theme
const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
];

type SafeRouteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface RouteOption {
  route: SafeRoute;
  isSelected: boolean;
}

export const SafeRouteScreen: React.FC = () => {
  const navigation = useNavigation<SafeRouteScreenNavigationProp>();
  const { location, getCurrentLocation, requestPermission } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingDestination, setIsSelectingDestination] = useState(true);
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

  // Fit map to route bounds
  const fitMapToRoute = useCallback((route: SafeRoute) => {
    const waypoints = route.waypoints || route.decodedCoordinates;
    if (mapRef.current && waypoints && waypoints.length > 0) {
      mapRef.current.fitToCoordinates(waypoints, {
        edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, []);

  // Handle map press for destination
  const handleMapPress = useCallback(
    (event: any) => {
      if (isSelectingDestination) {
        const { coordinate } = event.nativeEvent;
        setDestination(coordinate);
      }
    },
    [isSelectingDestination]
  );

  // Find routes
  const handleFindRoutes = useCallback(async () => {
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
        'Unable to get your current location. Please make sure GPS is enabled and location permission is granted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: async () => {
              setIsLoadingLocation(true);
              await getCurrentLocation();
              setIsLoadingLocation(false);
            }
          },
        ]
      );
      return;
    }

    if (!destination) {
      Alert.alert('Error', 'Please select a destination');
      return;
    }

    setIsLoading(true);
    setIsSelectingDestination(false);

    try {
      console.log('🗺️ Finding routes from:', currentLoc, 'to:', destination);
      
      const foundRoutes = await findSafeRoute(currentLoc, destination);
      
      console.log('✅ Found routes:', foundRoutes?.length || 0);

      if (!foundRoutes || foundRoutes.length === 0) {
        Alert.alert('No Routes Found', 'Unable to find routes to this destination');
        setIsSelectingDestination(true);
        return;
      }

      // DEBUG: Log route details
      foundRoutes.forEach((route, idx) => {
        console.log(`🛣️ Route ${idx + 1}:`, {
          name: route.name,
          waypointsCount: route.waypoints?.length || 0,
          decodedCount: route.decodedCoordinates?.length || 0,
          firstPoint: route.waypoints?.[0] || route.decodedCoordinates?.[0],
          lastPoint: route.waypoints?.[route.waypoints?.length - 1] || route.decodedCoordinates?.[route.decodedCoordinates?.length - 1],
        });
      });

      const routeOptions: RouteOption[] = foundRoutes.map((route, index) => ({
        route,
        isSelected: index === 0,
      }));

      setRoutes(routeOptions);
      setSelectedRouteIndex(0);

      // Fit map to first route
      setTimeout(() => fitMapToRoute(foundRoutes[0]), 500);
    } catch (error) {
      console.error('❌ Route finding error:', error);
      console.error('❌ Error message:', (error as Error)?.message);
      console.error('❌ Error stack:', (error as Error)?.stack);
      Alert.alert('Error', 'Failed to find routes. Please try again.');
      setIsSelectingDestination(true);
    } finally {
      setIsLoading(false);
    }
  }, [location, destination, fitMapToRoute, getCurrentLocation]);

  // Select route
  const handleSelectRoute = useCallback(
    (index: number) => {
      if (index < 0 || index >= routes.length) return;
      
      setSelectedRouteIndex(index);
      setRoutes((prev) =>
        prev.map((r, i) => ({ ...r, isSelected: i === index }))
      );

      const selectedRoute = routes[index];
      if (selectedRoute?.route) {
        fitMapToRoute(selectedRoute.route);
      }
    },
    [routes, fitMapToRoute]
  );

  // Start navigation
  const handleStartNavigation = useCallback(() => {
    const selectedRoute = routes[selectedRouteIndex]?.route;
    if (!selectedRoute) return;

    Alert.alert(
      'Start Navigation',
      `Ready to navigate via ${selectedRoute.name}!\n\nDistance: ${formatDistance(selectedRoute.distance || 0)}\nETA: ${formatDuration(selectedRoute.duration || 0)}\nSafety Score: ${selectedRoute.safetyScore}/100`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => {
          Alert.alert('Coming Soon', 'Turn-by-turn navigation will be available in the next update!');
        }}
      ]
    );
  }, [routes, selectedRouteIndex]);

  // Reset selection
  const handleReset = useCallback(() => {
    setDestination(null);
    setDestinationName('');
    setRoutes([]);
    setSelectedRouteIndex(0);
    setIsSelectingDestination(true);
  }, []);

  // Get route color based on safety score
  const getRouteColor = (safetyScore: number, isSelected: boolean): string => {
    if (!isSelected) return '#64748b80';
    if (safetyScore >= 80) return '#22c55e';
    if (safetyScore >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Get safety level label
  const getSafetyLabel = (score: number): string => {
    if (score >= 80) return 'Very Safe';
    if (score >= 60) return 'Moderately Safe';
    if (score >= 40) return 'Use Caution';
    return 'Not Recommended';
  };

  const selectedRoute = routes[selectedRouteIndex]?.route;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        title="Safe Route"
        onMenuPress={() => navigation.goBack()}
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
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }
              : {
                  latitude: 28.6139,
                  longitude: 77.2090,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
          }
          onPress={handleMapPress}
        >
          {/* Origin marker */}
          {location && (
            <Marker coordinate={location} title="Your Location">
              <View style={styles.originMarker}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </Marker>
          )}

          {/* Destination marker */}
          {destination && (
            <Marker coordinate={destination} title={destinationName || 'Destination'}>
              <View style={styles.destinationMarker}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={24}
                  color={colors.primary}
                />
              </View>
            </Marker>
          )}

          {/* Route polylines */}
          {routes.length > 0 && routes
            .map((routeOption, index) => ({ routeOption, originalIndex: index }))
            .filter(({ routeOption }) => routeOption?.route)
            .sort((a, b) => (a.originalIndex === selectedRouteIndex ? 1 : -1))
            .map(({ routeOption, originalIndex }) => {
              const coordinates = routeOption.route.waypoints || routeOption.route.decodedCoordinates || [];
              
              if (coordinates.length === 0) {
                console.warn(`⚠️ Route ${originalIndex} has no coordinates`);
                return null;
              }

              return (
                <Polyline
                  key={routeOption.route.id}
                  coordinates={coordinates}
                  strokeColor={getRouteColor(
                    routeOption.route.safetyScore,
                    originalIndex === selectedRouteIndex
                  )}
                  strokeWidth={originalIndex === selectedRouteIndex ? 6 : 4}
                  lineDashPattern={originalIndex === selectedRouteIndex ? undefined : [10, 10]}
                  tappable
                  onPress={() => handleSelectRoute(originalIndex)}
                />
              );
            })}

          {/* Hazard markers */}
          {selectedRoute?.hazards?.map((hazard: any, index: number) => (
            <React.Fragment key={`hazard-${index}`}>
              <Circle
                center={hazard.center}
                radius={hazard.radius || 50}
                fillColor="rgba(239, 68, 68, 0.15)"
                strokeColor="rgba(239, 68, 68, 0.5)"
                strokeWidth={2}
              />
              <Marker
                coordinate={hazard.center}
                title={hazard.reason}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[
                  styles.hazardMarker,
                  hazard.severity === 'high' && styles.hazardMarkerHigh,
                  hazard.severity === 'medium' && styles.hazardMarkerMedium,
                ]}>
                  <MaterialCommunityIcons
                    name="alert"
                    size={16}
                    color={hazard.severity === 'high' ? '#ef4444' : '#f59e0b'}
                  />
                </View>
              </Marker>
            </React.Fragment>
          ))}
        </MapView>

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Finding safe routes...</Text>
              <Text style={styles.loadingSubtext}>Analyzing safety data</Text>
            </View>
          </View>
        )}

        {/* Instruction overlay */}
        {isSelectingDestination && !destination && !isLoading && (
          <View style={styles.instructionOverlay}>
            <View style={styles.instructionCard}>
              <MaterialCommunityIcons
                name="gesture-tap"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.instructionText}>
                Tap on the map to select your destination
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {routes.length > 0 && selectedRoute ? (
          <View style={styles.routeDetailsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routeSelector}
              contentContainerStyle={styles.routeSelectorContent}
            >
              {routes.map((routeOption, index) => {
                if (!routeOption?.route) return null;
                
                return (
                  <TouchableOpacity
                    key={routeOption.route.id}
                    style={[
                      styles.routeTab,
                      index === selectedRouteIndex && styles.routeTabSelected,
                    ]}
                    onPress={() => handleSelectRoute(index)}
                  >
                    <Text
                      style={[
                        styles.routeTabLabel,
                        index === selectedRouteIndex && styles.routeTabLabelSelected,
                      ]}
                    >
                      Route {index + 1}
                    </Text>
                    <SafetyScoreBadge score={routeOption.route.safetyScore} size="small" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.selectedRouteDetails}>
              <View style={styles.routeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{selectedRoute.name}</Text>
                  <Text
                    style={[
                      styles.safetyLabel,
                      { color: getRouteColor(selectedRoute.safetyScore, true) },
                    ]}
                  >
                    {getSafetyLabel(selectedRoute.safetyScore)}
                  </Text>
                </View>
                <SafetyScoreBadge score={selectedRoute.safetyScore} size="large" />
              </View>

              <View style={styles.routeStats}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statValue}>
                    {formatDistance(selectedRoute.distance || selectedRoute.totalDistance || 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statValue}>
                    {formatDuration(selectedRoute.duration || selectedRoute.totalDuration || 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.statValue}>
                    {selectedRoute.hazards?.length || 0} hazards
                  </Text>
                </View>
              </View>

              {selectedRoute.safetyFactors && (
                <View style={styles.safetyFactors}>
                  <Text style={styles.factorsLabel}>Safety Factors</Text>
                  <View style={styles.factorRow}>
                    <View style={styles.factorItem}>
                      <MaterialCommunityIcons
                        name="lightbulb-on"
                        size={16}
                        color={colors.warning}
                      />
                      <Text style={styles.factorLabel}>Lighting</Text>
                      <Text style={styles.factorValue}>
                        {selectedRoute.safetyFactors.lighting?.toFixed(1) || '--'}/5
                      </Text>
                    </View>
                    <View style={styles.factorItem}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={16}
                        color={colors.info}
                      />
                      <Text style={styles.factorLabel}>Crowd</Text>
                      <Text style={styles.factorValue}>
                        {selectedRoute.safetyFactors.crowd?.toFixed(1) || '--'}/5
                      </Text>
                    </View>
                    <View style={styles.factorItem}>
                      <MaterialCommunityIcons
                        name="shield-check"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={styles.factorLabel}>Reports</Text>
                      <Text style={styles.factorValue}>
                        {selectedRoute.safetyFactors.reports?.toFixed(1) || '--'}/5
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.actionButtons}>
                <Button
                  title="Change"
                  variant="outline"
                  onPress={handleReset}
                  style={styles.actionButton}
                />
                <Button
                  title="Start Navigation"
                  onPress={handleStartNavigation}
                  style={styles.actionButtonPrimary}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.destinationPanel}>
            {destination ? (
              <>
                <View style={styles.destinationInfo}>
                  <View style={styles.destinationIcon}>
                    <MaterialCommunityIcons
                      name="flag-checkered"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.destinationDetails}>
                    <Text style={styles.destinationLabel}>Destination</Text>
                    <Text style={styles.destinationCoords}>
                      {destination.latitude.toFixed(6)}, {destination.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setDestination(null)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                <Button
                  title="Find Safe Routes"
                  onPress={handleFindRoutes}
                  loading={isLoading}
                  disabled={isLoadingLocation}
                />
              </>
            ) : (
              <View style={styles.emptyDestination}>
                <MaterialCommunityIcons
                  name="map-marker-question"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>Where are you going?</Text>
                <Text style={styles.emptyText}>
                  Tap anywhere on the map to set your destination
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
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
  originMarker: {
    backgroundColor: colors.primary + '30',
    borderRadius: 20,
    padding: 6,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  destinationMarker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    ...shadows.medium,
  },
  hazardMarker: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: borderRadius.full,
    padding: 6,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  hazardMarkerHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#ef4444',
  },
  hazardMarkerMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: '#f59e0b',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    ...shadows.large,
    minWidth: 200,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  instructionOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  instructionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  instructionText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  bottomPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.large,
  },
  routeDetailsContainer: {
    paddingBottom: spacing.lg,
  },
  routeSelector: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  routeSelectorContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  routeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  routeTabSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  routeTabLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  routeTabLabelSelected: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  selectedRouteDetails: {
    padding: spacing.lg,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  routeName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  safetyLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  safetyFactors: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  factorsLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  factorItem: {
    alignItems: 'center',
    gap: 4,
  },
  factorLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  factorValue: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonPrimary: {
    flex: 2,
  },
  destinationPanel: {
    padding: spacing.lg,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  destinationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  destinationLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  destinationCoords: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  clearButton: {
    padding: spacing.xs,
  },
  emptyDestination: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});

export default SafeRouteScreen;