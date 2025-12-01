import { Coordinates, LocationWithTimestamp } from './location';
import { TrustedContact } from './contact';

// Walk With Me session status
export type WalkSessionStatus = 'active' | 'completed' | 'cancelled' | 'emergency';

// Walk With Me session
export interface WalkSession {
  id: string;
  userId: string;
  userName: string;
  startLocation: Coordinates;
  destination: Coordinates;
  destinationName?: string;
  startTime: number;
  estimatedArrival?: number;
  status: WalkSessionStatus;
  endTime?: number;
  currentLocation: LocationWithTimestamp;
  trackedContacts: string[]; // Contact IDs who are following
  sharedWith?: string[]; // Alias for trackedContacts
  locationHistory: LocationWithTimestamp[];
}

// Create walk session input
export interface CreateWalkSessionInput {
  destination: Coordinates;
  destinationName?: string;
  trackedContacts: string[];
}

// Live location update (for Realtime Database)
export interface LiveLocationUpdate {
  sessionId: string;
  userId: string;
  location: LocationWithTimestamp;
  status: WalkSessionStatus;
  updatedAt: number;
}

// Walk With Me state
export interface WalkWithMeState {
  isActive: boolean;
  currentSession: WalkSession | null;
  selectedContacts: TrustedContact[];
  destination: Coordinates | null;
  destinationName: string;
}

// Contact view of walk session
export interface WatchedWalk {
  sessionId: string;
  walkerName: string;
  walkerPhotoUrl?: string;
  currentLocation: LocationWithTimestamp;
  destination: Coordinates;
  destinationName?: string;
  startTime: number;
  status: WalkSessionStatus;
}
