import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDB } from './firebase';
import {
  RoadRating,
  CreateRatingInput,
  AggregatedRoadRating,
} from '../types';
import { COLLECTIONS } from '../config';
import { getCurrentUser } from './authService';

// Create a new road rating
export const createRating = async (input: CreateRatingInput): Promise<RoadRating> => {
  const db = getFirestoreDB();
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be authenticated to create a rating');
  }

  // Handle both old and new input formats
  const startLoc = input.startLocation || input.location;
  const endLoc = input.endLocation || input.location;
  const routeId = input.routeId || 'default_route';
  const lighting = input.lightingQuality ?? input.lightingRating ?? 3;
  const crowd = input.crowdLevel ?? input.crowdRating ?? 3;
  const safety = input.safetyFeeling ?? input.safetyFeelingRating ?? 3;

  const ratingData = {
    userId: user.uid,
    routeId: routeId,
    startLocation: startLoc ? {
      latitude: startLoc.latitude,
      longitude: startLoc.longitude,
    } : { latitude: 0, longitude: 0 },
    endLocation: endLoc ? {
      latitude: endLoc.latitude,
      longitude: endLoc.longitude,
    } : { latitude: 0, longitude: 0 },
    lightingQuality: lighting,
    crowdLevel: crowd,
    safetyFeeling: safety,
    comment: input.comment || input.notes,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.ROAD_RATINGS), ratingData);

  return {
    id: docRef.id,
    userId: user.uid,
    routeId: routeId,
    startLocation: startLoc || { latitude: 0, longitude: 0 },
    endLocation: endLoc || { latitude: 0, longitude: 0 },
    lightingQuality: lighting,
    crowdLevel: crowd,
    safetyFeeling: safety,
    comment: input.comment || input.notes,
    createdAt: Date.now(),
  };
};

// Get ratings for a specific route
export const getRatingsForRoute = async (routeId: string): Promise<RoadRating[]> => {
  const db = getFirestoreDB();

  const ratingsQuery = query(
    collection(db, COLLECTIONS.ROAD_RATINGS),
    where('routeId', '==', routeId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(ratingsQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const createdAt = data.createdAt as Timestamp;

    return {
      id: docSnapshot.id,
      userId: data.userId,
      routeId: data.routeId,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      lightingQuality: data.lightingQuality,
      crowdLevel: data.crowdLevel,
      safetyFeeling: data.safetyFeeling,
      comment: data.comment,
      createdAt: createdAt?.toMillis() || Date.now(),
    };
  });
};

// Get aggregated rating for a route
export const getAggregatedRating = async (
  routeId: string
): Promise<AggregatedRoadRating | null> => {
  const ratings = await getRatingsForRoute(routeId);

  if (ratings.length === 0) {
    return null;
  }

  const totalLighting = ratings.reduce((sum, r) => sum + r.lightingQuality, 0);
  const totalCrowd = ratings.reduce((sum, r) => sum + r.crowdLevel, 0);
  const totalSafety = ratings.reduce((sum, r) => sum + r.safetyFeeling, 0);
  const count = ratings.length;

  const avgLighting = totalLighting / count;
  const avgCrowd = totalCrowd / count;
  const avgSafety = totalSafety / count;

  // Calculate overall score (0-100)
  // Each rating is 1-5, so average of three gives 1-5
  // Convert to 0-100 scale
  const overallScore = ((avgLighting + avgCrowd + avgSafety) / 3 - 1) * 25;

  return {
    routeId,
    avgLightingQuality: avgLighting,
    avgCrowdLevel: avgCrowd,
    avgSafetyFeeling: avgSafety,
    totalRatings: count,
    overallScore: Math.round(overallScore),
  };
};

// Get all ratings by user
export const getUserRatings = async (userId: string): Promise<RoadRating[]> => {
  const db = getFirestoreDB();

  const ratingsQuery = query(
    collection(db, COLLECTIONS.ROAD_RATINGS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(ratingsQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const createdAt = data.createdAt as Timestamp;

    return {
      id: docSnapshot.id,
      userId: data.userId,
      routeId: data.routeId,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      lightingQuality: data.lightingQuality,
      crowdLevel: data.crowdLevel,
      safetyFeeling: data.safetyFeeling,
      comment: data.comment,
      createdAt: createdAt?.toMillis() || Date.now(),
    };
  });
};

// Generate a route ID from start and end coordinates
export const generateRouteId = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): string => {
  // Round to 4 decimal places for grouping nearby routes
  const precision = 4;
  const sLat = startLat.toFixed(precision);
  const sLng = startLng.toFixed(precision);
  const eLat = endLat.toFixed(precision);
  const eLng = endLng.toFixed(precision);

  return `${sLat}_${sLng}_${eLat}_${eLng}`;
};

// Submit a rating (alias for createRating)
export const submitRating = createRating;
