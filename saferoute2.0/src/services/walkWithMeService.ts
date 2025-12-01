import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WalkSession,
  CreateWalkSessionInput,
  LocationWithTimestamp,
  WalkSessionStatus,
  Coordinates,
} from '../types';

const STORAGE_KEY = '@saferoute_walk_session';

// Generate unique ID
const generateId = (): string => {
  return `walk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new walk session
export const createWalkSession = async (
  input: CreateWalkSessionInput,
  currentLocation: LocationWithTimestamp
): Promise<WalkSession> => {
  const sessionId = generateId();

  const session: WalkSession = {
    id: sessionId,
    userId: 'local_user',
    userName: 'SafeRoute User',
    startLocation: {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    },
    destination: input.destination,
    destinationName: input.destinationName,
    startTime: Date.now(),
    status: 'active',
    currentLocation,
    trackedContacts: input.trackedContacts,
    locationHistory: [currentLocation],
    sharedWith: input.trackedContacts,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  return session;
};

// Update live location
export const updateWalkLocation = async (
  sessionId: string,
  location: LocationWithTimestamp
): Promise<void> => {
  try {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!sessionJson) return;

    const session: WalkSession = JSON.parse(sessionJson);
    if (session.id !== sessionId) return;

    // Keep last 100 locations
    const history = session.locationHistory || [];
    const newHistory = [...history.slice(-99), location];

    const updatedSession: WalkSession = {
      ...session,
      currentLocation: location,
      locationHistory: newHistory,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
  } catch (error) {
    console.error('Failed to update walk location:', error);
  }
};

// Update session status
export const updateWalkSessionStatus = async (
  sessionId: string,
  status: WalkSessionStatus
): Promise<void> => {
  try {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!sessionJson) return;

    const session: WalkSession = JSON.parse(sessionJson);
    if (session.id !== sessionId) return;

    const updatedSession: WalkSession = {
      ...session,
      status,
      endTime: status === 'completed' || status === 'cancelled' ? Date.now() : undefined,
    };

    if (status === 'completed' || status === 'cancelled') {
      // Clear session when completed
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    }
  } catch (error) {
    console.error('Failed to update session status:', error);
  }
};

// End walk session
export const endWalkSession = async (
  sessionId: string,
  status: WalkSessionStatus = 'completed'
): Promise<void> => {
  await updateWalkSessionStatus(sessionId, status);
};

// Get walk session by ID
export const getWalkSession = async (sessionId: string): Promise<WalkSession | null> => {
  try {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!sessionJson) return null;

    const session: WalkSession = JSON.parse(sessionJson);
    return session.id === sessionId ? session : null;
  } catch (error) {
    console.error('Failed to get walk session:', error);
    return null;
  }
};

// Subscribe to walk session updates (simplified local version)
export const subscribeToWalkSession = (
  sessionId: string,
  callback: (session: WalkSession | null) => void
): (() => void) => {
  // For local storage, we'll poll periodically
  const intervalId = setInterval(async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (!sessionJson) {
        callback(null);
        return;
      }

      const session: WalkSession = JSON.parse(sessionJson);
      if (session.id === sessionId && session.status === 'active') {
        callback(session);
      } else {
        callback(null);
      }
    } catch (error) {
      callback(null);
    }
  }, 5000); // Poll every 5 seconds

  // Return unsubscribe function
  return () => clearInterval(intervalId);
};

// Get active walk session for current user
export const getActiveWalkSession = async (
  userId?: string
): Promise<WalkSession | null> => {
  try {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!sessionJson) return null;

    const session: WalkSession = JSON.parse(sessionJson);
    return session.status === 'active' ? session : null;
  } catch (error) {
    console.error('Failed to get active walk session:', error);
    return null;
  }
};

// Get sessions where user is being tracked (not applicable in local mode)
export const getWatchedSessions = async (
  contactUserId: string
): Promise<WalkSession[]> => {
  return [];
};

// Cleanup old sessions (local version - just clear if completed)
export const cleanupOldSessions = async (olderThanHours: number = 24): Promise<void> => {
  try {
    const sessionJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!sessionJson) return;

    const session: WalkSession = JSON.parse(sessionJson);
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    if (
      (session.status === 'completed' || session.status === 'cancelled') &&
      session.endTime &&
      session.endTime < cutoffTime
    ) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
  }
};

// Calculate estimated arrival time
export const calculateETA = (
  currentLocation: LocationWithTimestamp | Coordinates,
  destination: { latitude: number; longitude: number },
  averageWalkingSpeedMps: number = 1.4 // ~5 km/h
): number | null => {
  const distance = calculateDistanceMeters(
    currentLocation.latitude,
    currentLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  if (distance <= 0) {
    return null;
  }

  const durationSeconds = distance / averageWalkingSpeedMps;
  return Date.now() + durationSeconds * 1000;
};

// Helper: Calculate distance in meters
const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
