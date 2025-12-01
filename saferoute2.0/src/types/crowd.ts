import { Coordinates } from './location';

// Crowd density level
export type CrowdLevel = 'low' | 'medium' | 'high';

// Crowd density data point
export interface CrowdDensityPoint {
  location: Coordinates;
  level: CrowdLevel;
  count?: number; // Estimated count if available
  timestamp: number;
}

// Heatmap data for display
export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number; // 0-1 for intensity
}

// Crowd density region
export interface CrowdDensityRegion {
  id: string;
  center: Coordinates;
  radius: number; // in meters
  level: CrowdLevel;
  lastUpdated: number;
}

// Crowd density config
export const CROWD_DENSITY_CONFIG: Record<CrowdLevel, { label: string; color: string; minWeight: number; maxWeight: number }> = {
  low: {
    label: 'Empty - Use Caution',
    color: 'rgba(239, 68, 68, 0.5)',
    minWeight: 0,
    maxWeight: 0.33,
  },
  medium: {
    label: 'Light Crowd',
    color: 'rgba(245, 158, 11, 0.5)',
    minWeight: 0.34,
    maxWeight: 0.66,
  },
  high: {
    label: 'Busy - Safe',
    color: 'rgba(16, 185, 129, 0.5)',
    minWeight: 0.67,
    maxWeight: 1,
  },
};
