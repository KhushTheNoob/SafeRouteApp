import { CrowdDensityPoint, CrowdLevel, HeatmapPoint, Coordinates } from '../types';

// Mock crowd density data generator
// In production, this would connect to a real data source (campus WiFi, Bluetooth beacons, etc.)

// Generate mock crowd density data for an area
export const generateMockCrowdData = (
  center: Coordinates,
  radiusKm: number = 2
): CrowdDensityPoint[] => {
  const points: CrowdDensityPoint[] = [];
  const numPoints = 20;

  for (let i = 0; i < numPoints; i++) {
    // Generate random points within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;

    const latOffset = (distance / 111) * Math.cos(angle);
    const lngOffset = (distance / (111 * Math.cos(center.latitude * (Math.PI / 180)))) * Math.sin(angle);

    // Determine crowd level based on time and random factor
    const level = determineCrowdLevel();

    points.push({
      location: {
        latitude: center.latitude + latOffset,
        longitude: center.longitude + lngOffset,
      },
      level,
      count: getEstimatedCount(level),
      timestamp: Date.now(),
    });
  }

  return points;
};

// Determine crowd level (simulates real-world patterns)
const determineCrowdLevel = (): CrowdLevel => {
  const hour = new Date().getHours();
  const random = Math.random();

  // Simulate typical patterns
  if (hour >= 22 || hour < 6) {
    // Late night / early morning - mostly low
    if (random < 0.7) return 'low';
    if (random < 0.9) return 'medium';
    return 'high';
  } else if (hour >= 17 && hour < 22) {
    // Evening - mixed
    if (random < 0.3) return 'low';
    if (random < 0.7) return 'medium';
    return 'high';
  } else {
    // Daytime - mostly high/medium
    if (random < 0.2) return 'low';
    if (random < 0.5) return 'medium';
    return 'high';
  }
};

// Get estimated people count based on level
const getEstimatedCount = (level: CrowdLevel): number => {
  switch (level) {
    case 'low':
      return Math.floor(Math.random() * 5);
    case 'medium':
      return 5 + Math.floor(Math.random() * 15);
    case 'high':
      return 20 + Math.floor(Math.random() * 30);
    default:
      return 0;
  }
};

// Convert crowd density points to heatmap format
export const convertToHeatmapPoints = (
  densityPoints: CrowdDensityPoint[]
): HeatmapPoint[] => {
  return densityPoints.map((point) => ({
    latitude: point.location.latitude,
    longitude: point.location.longitude,
    weight: crowdLevelToWeight(point.level),
  }));
};

// Convert crowd level to heatmap weight
const crowdLevelToWeight = (level: CrowdLevel): number => {
  switch (level) {
    case 'high':
      return 1.0; // Full intensity (green/safe)
    case 'medium':
      return 0.5; // Medium intensity
    case 'low':
      return 0.2; // Low intensity (red/caution)
    default:
      return 0;
  }
};

// Get crowd level for a specific location
export const getCrowdLevelAtLocation = (
  location: Coordinates,
  densityPoints: CrowdDensityPoint[]
): CrowdLevel => {
  // Find nearest point
  let nearestPoint: CrowdDensityPoint | null = null;
  let nearestDistance = Infinity;

  for (const point of densityPoints) {
    const distance = calculateDistanceMeters(
      location.latitude,
      location.longitude,
      point.location.latitude,
      point.location.longitude
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  }

  // If nearest point is within 500m, return its level
  if (nearestPoint && nearestDistance < 500) {
    return nearestPoint.level;
  }

  // Default to low if no data
  return 'low';
};

// Calculate safety implication of crowd level
export const getCrowdSafetyScore = (level: CrowdLevel): number => {
  // Higher crowd = safer (more witnesses, less risk)
  switch (level) {
    case 'high':
      return 100;
    case 'medium':
      return 60;
    case 'low':
      return 30;
    default:
      return 50;
  }
};

// Get crowd level description
export const getCrowdDescription = (level: CrowdLevel): string => {
  switch (level) {
    case 'high':
      return 'Busy area - Good for safety';
    case 'medium':
      return 'Moderate activity - Stay aware';
    case 'low':
      return 'Empty area - Use caution';
    default:
      return 'Unknown crowd level';
  }
};

// Helper: Calculate distance in meters
const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
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

// Simulate real-time updates (for demo)
export const simulateCrowdUpdates = (
  center: Coordinates,
  callback: (points: CrowdDensityPoint[]) => void,
  intervalMs: number = 30000
): (() => void) => {
  const interval = setInterval(() => {
    const newData = generateMockCrowdData(center);
    callback(newData);
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
};
