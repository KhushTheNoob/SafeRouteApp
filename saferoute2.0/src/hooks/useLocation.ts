import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { LocationWithTimestamp, LocationState } from '../types';
import { LOCATION_UPDATE_INTERVAL, LOCATION_DISTANCE_FILTER } from '../config';

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    isTracking: false,
    permissionStatus: 'undetermined',
    error: null,
  });

  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      setState((prev) => ({
        ...prev,
        permissionStatus: status === 'granted' ? 'granted' : 'denied',
      }));

      return status === 'granted';
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to request location permission',
      }));
      return false;
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationWithTimestamp | null> => {
    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setState((prev) => ({
          ...prev,
          error: 'Location services are disabled. Please enable GPS.',
        }));
        return null;
      }

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((prev) => ({
          ...prev,
          error: 'Location permission not granted.',
        }));
        return null;
      }

      let location;
      
      // Try to get last known position first (faster)
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          location = lastKnown;
        }
      } catch (e) {
        // Ignore, will try getCurrentPosition
      }

      // If no last known or it's too old, get fresh location
      if (!location || (Date.now() - location.timestamp > 60000)) {
        try {
          // Try with balanced accuracy (faster than high)
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (balancedError) {
          // Fall back to low accuracy if balanced fails
          console.log('Balanced accuracy failed, trying low...');
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }
      }

      const locationData: LocationWithTimestamp = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy ?? undefined,
        altitude: location.coords.altitude ?? undefined,
        speed: location.coords.speed ?? undefined,
        heading: location.coords.heading ?? undefined,
      };

      setState((prev) => ({
        ...prev,
        currentLocation: locationData,
        error: null,
      }));

      return locationData;
    } catch (error) {
      console.error('Location error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to get current location. Make sure GPS is enabled.',
      }));
      return null;
    }
  }, [requestPermission]);

  // Start continuous location tracking
  const startTracking = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Stop existing subscription if any
      if (locationSubscription) {
        locationSubscription.remove();
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: LOCATION_DISTANCE_FILTER,
        },
        (location) => {
          const locationData: LocationWithTimestamp = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
            speed: location.coords.speed ?? undefined,
            heading: location.coords.heading ?? undefined,
          };

          setState((prev) => ({
            ...prev,
            currentLocation: locationData,
            isTracking: true,
            error: null,
          }));
        }
      );

      setLocationSubscription(subscription);
      setState((prev) => ({ ...prev, isTracking: true }));

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to start location tracking',
        isTracking: false,
      }));
      return false;
    }
  }, [requestPermission, locationSubscription]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, [locationSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
      }));
    };

    checkPermission();
  }, []);

  return {
    ...state,
    // Alias for backward compatibility
    location: state.currentLocation,
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
};

export default useLocation;
