import { Coordinates } from './location';

// Road rating interface
export interface RoadRating {
  id: string;
  userId: string;
  routeId: string; // Unique identifier for the road segment
  startLocation: Coordinates;
  endLocation: Coordinates;
  lightingQuality: number; // 1-5
  crowdLevel: number; // 1-5
  safetyFeeling: number; // 1-5
  comment?: string;
  createdAt: number;
}

// Create rating input (for screens)
export interface CreateRatingInput {
  routeId?: string;
  streetName?: string;
  location?: Coordinates;
  startLocation?: Coordinates;
  endLocation?: Coordinates;
  lightingQuality?: number;
  crowdLevel?: number;
  safetyFeeling?: number;
  lightingRating?: number;
  crowdRating?: number;
  safetyFeelingRating?: number;
  comment?: string;
  notes?: string;
  timeOfDay?: string;
}

// Aggregated road rating
export interface AggregatedRoadRating {
  routeId: string;
  avgLightingQuality: number;
  avgCrowdLevel: number;
  avgSafetyFeeling: number;
  totalRatings: number;
  overallScore: number; // Calculated composite score
}
