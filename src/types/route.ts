import { Coordinates } from './location';

// Route point with safety info
export interface RoutePoint extends Coordinates {
  safetyScore?: number;
  isHazard?: boolean;
}

// Route leg information
export interface RouteLeg {
  startLocation: Coordinates;
  endLocation: Coordinates;
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string; // encoded polyline
  steps: RouteStep[];
}

// Individual route step
export interface RouteStep {
  startLocation: Coordinates;
  endLocation: Coordinates;
  distance: number;
  duration: number;
  instruction: string;
  polyline: string;
}

// Complete route with safety analysis
export interface SafeRoute {
  id: string;
  name?: string;
  origin: Coordinates;
  destination: Coordinates;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  distance?: number; // Alias for totalDistance
  duration?: number; // Alias for totalDuration
  safetyScore: number; // 0-100
  encodedPolyline: string;
  decodedCoordinates: Coordinates[];
  waypoints?: Coordinates[]; // Alias for decodedCoordinates
  hazardZones: HazardZone[];
  hazards?: HazardZone[]; // Alias for hazardZones
  isBestRoute: boolean;
  safetyFactors?: {
    lighting?: number;
    crowd?: number;
    reports?: number;
  };
}

// Hazard zone along route
export interface HazardZone {
  center: Coordinates;
  radius: number; // in meters
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

// Route request input
export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  alternatives?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

// Route response from API
export interface RouteResponse {
  routes: SafeRoute[];
  bestRouteIndex: number;
  status: 'success' | 'no_route' | 'error';
  errorMessage?: string;
}

// Safety score breakdown
export interface SafetyScoreBreakdown {
  lightingScore: number;
  crowdScore: number;
  reportScore: number;
  totalScore: number;
}
