import { useState, useEffect, useCallback } from 'react';
import { CrowdDensityPoint, CrowdLevel, Coordinates } from '../types';
import {
  generateMockCrowdData,
  simulateCrowdUpdates,
  getCrowdLevelAtLocation,
  getCrowdSafetyScore,
} from '../services/crowdService';

interface UseCrowdDensityState {
  densityPoints: CrowdDensityPoint[];
  isLoading: boolean;
  lastUpdated: number | null;
}

export const useCrowdDensity = (center?: Coordinates, radiusKm: number = 2) => {
  const [state, setState] = useState<UseCrowdDensityState>({
    densityPoints: [],
    isLoading: true,
    lastUpdated: null,
  });

  // Load initial data and start updates
  useEffect(() => {
    if (!center) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      return;
    }

    // Generate initial mock data
    const initialData = generateMockCrowdData(center, radiusKm);
    setState({
      densityPoints: initialData,
      isLoading: false,
      lastUpdated: Date.now(),
    });

    // Start simulated updates (every 30 seconds)
    const cleanup = simulateCrowdUpdates(
      center,
      (newData: CrowdDensityPoint[]) => {
        setState({
          densityPoints: newData,
          isLoading: false,
          lastUpdated: Date.now(),
        });
      },
      30000
    );

    return () => cleanup();
  }, [center?.latitude, center?.longitude, radiusKm]);

  // Refresh data manually
  const refresh = useCallback(() => {
    if (!center) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    const newData = generateMockCrowdData(center, radiusKm);
    setState({
      densityPoints: newData,
      isLoading: false,
      lastUpdated: Date.now(),
    });
  }, [center, radiusKm]);

  // Get crowd level at a specific location
  const getCrowdLevel = useCallback(
    (location: Coordinates): CrowdLevel => {
      return getCrowdLevelAtLocation(location, state.densityPoints);
    },
    [state.densityPoints]
  );

  // Get safety score at a location
  const getSafetyScore = useCallback(
    (location: Coordinates): number => {
      const level = getCrowdLevel(location);
      return getCrowdSafetyScore(level);
    },
    [getCrowdLevel]
  );

  return {
    ...state,
    refresh,
    getCrowdLevel,
    getSafetyScore,
  };
};

export default useCrowdDensity;
