import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LongPressEvent } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapHeader, SOSButton, ReportButton, SafeRouteButton, MapMarkers, BottomSheet, ReportCard } from '../components';
import { useLocation, useReports, useSOS, useCrowdDensity } from '../hooks';
import { colors, MAP_DEFAULT_DELTA } from '../config';
import { Report, RootStackParamList, Coordinates } from '../types';

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// Custom dark map style for night mode
const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1d2c4d' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8ec3b9' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a3646' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#255763' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c6675' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#283d6a' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
];

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const {
    currentLocation,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
    error: locationError,
  } = useLocation();

  const { reports, getReportMarkers } = useReports(
    currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : undefined
  );

  const { isActive: sosActive, activateSOS } = useSOS();

  const { densityPoints } = useCrowdDensity(
    currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : undefined
  );

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Request location permission on mount
  useEffect(() => {
    const initLocation = async () => {
      setLocationLoading(true);
      try {
        if (permissionStatus === 'undetermined') {
          const granted = await requestPermission();
          if (!granted) {
            Alert.alert(
              'Location Permission Required',
              'SafeRoute needs location access to show your position on the map and provide safety features.',
              [{ text: 'OK' }]
            );
            setLocationLoading(false);
            return;
          }
        }
        
        if (permissionStatus === 'denied') {
          Alert.alert(
            'Location Permission Denied',
            'Please enable location access in your device settings to use SafeRoute.',
            [{ text: 'OK' }]
          );
          setLocationLoading(false);
          return;
        }

        const location = await getCurrentLocation();
        if (!location) {
          console.log('Could not get location, using default');
        }
      } catch (error) {
        console.error('Location init error:', error);
      } finally {
        setLocationLoading(false);
      }
    };

    initLocation();
  }, []);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        ...MAP_DEFAULT_DELTA,
      });
    }
  }, [currentLocation]);

  // Handle long press on map to create report
  const handleMapLongPress = useCallback((event: LongPressEvent) => {
    const { coordinate } = event.nativeEvent;
    Alert.alert(
      'Create Report',
      `Pin location at:\nLat: ${coordinate.latitude.toFixed(6)}\nLng: ${coordinate.longitude.toFixed(6)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Report',
          onPress: () => {
            navigation.navigate('Report', {
              location: coordinate,
            });
          },
        },
      ]
    );
  }, [navigation]);

  // Handle marker press
  const handleMarkerPress = useCallback((report: Report) => {
    setSelectedReport(report);
    setShowReportSheet(true);
  }, []);

  // Handle SOS button press
  const handleSOSPress = useCallback(async () => {
    if (sosActive) {
      navigation.navigate('SOS');
      return;
    }

    Alert.alert(
      'Activate SOS',
      'This will alert your trusted contacts and share your location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: async () => {
            if (currentLocation) {
              await activateSOS({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              });
              navigation.navigate('SOS');
            }
          },
        },
      ]
    );
  }, [sosActive, currentLocation, activateSOS, navigation]);

  // Handle report button press
  const handleReportPress = useCallback(() => {
    if (currentLocation) {
      navigation.navigate('Report', {
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      });
    } else {
      navigation.navigate('Report', {});
    }
  }, [currentLocation, navigation]);

  // Handle safe route button press
  const handleSafeRoutePress = useCallback(() => {
    if (currentLocation) {
      navigation.navigate('SafeRoute', {
        origin: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      });
    } else {
      navigation.navigate('SafeRoute', {});
    }
  }, [currentLocation, navigation]);

  const reportMarkers = getReportMarkers();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapHeader
        onProfilePress={() => {}}
        onMenuPress={() => {}}
      />

      {/* Location error banner */}
      {locationError && !currentLocation && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setLocationLoading(true);
              await getCurrentLocation();
              setLocationLoading(false);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading indicator */}
      {locationLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          onLongPress={handleMapLongPress}
          initialRegion={
            currentLocation
              ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  ...MAP_DEFAULT_DELTA,
                }
              : {
                  latitude: 37.7749,
                  longitude: -122.4194,
                  ...MAP_DEFAULT_DELTA,
                }
          }
        >
          <MapMarkers
            reports={reports}
            onMarkerPress={handleMarkerPress}
          />
        </MapView>

        {/* Action buttons */}
        <View style={styles.actionButtonsTop}>
          <SafeRouteButton
            onPress={handleSafeRoutePress}
            style={styles.safeRouteButton}
          />
        </View>

        <View style={styles.actionButtonsBottom}>
          <ReportButton
            onPress={handleReportPress}
            style={styles.reportButton}
          />
        </View>

        {/* SOS FAB */}
        <View style={styles.sosContainer}>
          <SOSButton
            onPress={handleSOSPress}
            isActive={sosActive}
            size="large"
          />
        </View>

        {/* Walk With Me FAB */}
        <View style={styles.walkWithMeContainer}>
          <SafeRouteButton
            onPress={() => navigation.navigate('WalkWithMe')}
            label="Walk With Me"
            style={styles.walkWithMeButton}
          />
        </View>
      </View>

      {/* Report detail bottom sheet */}
      <BottomSheet
        isVisible={showReportSheet}
        onClose={() => {
          setShowReportSheet(false);
          setSelectedReport(null);
        }}
        title="Report Details"
      >
        {selectedReport && (
          <ReportCard
            report={selectedReport}
            distanceKm={
              currentLocation
                ? undefined // Distance calculation would go here
                : undefined
            }
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: colors.textPrimary,
    marginTop: 8,
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  actionButtonsTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonsBottom: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  safeRouteButton: {
    minWidth: 180,
  },
  reportButton: {
    minWidth: 160,
  },
  sosContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
  },
  walkWithMeContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 100,
  },
  walkWithMeButton: {
    backgroundColor: colors.secondary,
  },
});

export default MapScreen;
