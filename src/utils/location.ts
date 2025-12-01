import { Coordinates } from '../types';

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate distance in meters
export const calculateDistanceMeters = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  return calculateDistance(coord1, coord2) * 1000;
};

// Convert degrees to radians
const toRad = (deg: number): number => deg * (Math.PI / 180);

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

// Format duration for display
export const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Format time since (e.g., "5 minutes ago")
export const formatTimeSince = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
};

// Calculate bounding box for a given center and radius
export const calculateBoundingBox = (
  center: Coordinates,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} => {
  const latDelta = radiusKm / 111; // ~111 km per degree latitude
  const lngDelta =
    radiusKm / (111 * Math.cos(center.latitude * (Math.PI / 180)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLng: center.longitude - lngDelta,
    maxLng: center.longitude + lngDelta,
  };
};

// Check if a coordinate is within a bounding box
export const isWithinBounds = (
  coord: Coordinates,
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }
): boolean => {
  return (
    coord.latitude >= bounds.minLat &&
    coord.latitude <= bounds.maxLat &&
    coord.longitude >= bounds.minLng &&
    coord.longitude <= bounds.maxLng
  );
};

// Get center of multiple coordinates
export const getCenterOfCoordinates = (coords: Coordinates[]): Coordinates => {
  if (coords.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const totalLat = coords.reduce((sum, c) => sum + c.latitude, 0);
  const totalLng = coords.reduce((sum, c) => sum + c.longitude, 0);

  return {
    latitude: totalLat / coords.length,
    longitude: totalLng / coords.length,
  };
};

// Calculate region delta based on coordinates
export const calculateRegionDelta = (
  coords: Coordinates[]
): { latitudeDelta: number; longitudeDelta: number } => {
  if (coords.length < 2) {
    return { latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }

  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add padding
  const latDelta = (maxLat - minLat) * 1.5;
  const lngDelta = (maxLng - minLng) * 1.5;

  return {
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

// Find nearest coordinate from a list
export const findNearestCoordinate = (
  target: Coordinates,
  coords: Coordinates[]
): { coordinate: Coordinates; distance: number; index: number } | null => {
  if (coords.length === 0) {
    return null;
  }

  let nearestIndex = 0;
  let nearestDistance = calculateDistanceMeters(target, coords[0]);

  for (let i = 1; i < coords.length; i++) {
    const distance = calculateDistanceMeters(target, coords[i]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  return {
    coordinate: coords[nearestIndex],
    distance: nearestDistance,
    index: nearestIndex,
  };
};

// Calculate bearing between two coordinates
export const calculateBearing = (
  from: Coordinates,
  to: Coordinates
): number => {
  const startLat = toRad(from.latitude);
  const startLng = toRad(from.longitude);
  const destLat = toRad(to.latitude);
  const destLng = toRad(to.longitude);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;

  return bearing;
};

// Get compass direction from bearing
export const getCompassDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};
