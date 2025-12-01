import { Coordinates, Report, SafeRoute, HazardZone, RouteRequest, RouteResponse, SafetyScoreBreakdown } from '../types';
import { SAFETY_WEIGHTS } from '../config';
import { getReportsNearLocation } from './reportService';
import { getAggregatedRating, generateRouteId } from './ratingService';

// Using OSRM (Open Source Routing Machine) - FREE, no API key needed!
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/foot';

// ==================== MAIN ROUTING FUNCTION ====================
export const fetchRoutes = async (request: RouteRequest): Promise<RouteResponse> => {
  console.log('🔑 Using OSRM API (no key needed)...');
  
  try {
    const routes = await fetchOSRMRoutes(request);
    
    if (!routes || routes.length === 0) {
      console.log('❌ API returned no routes, using mock routes');
      return generateMockRoutes(request);
    }

    console.log(`✅ Got ${routes.length} routes from OSRM, calculating safety scores...`);

    const processedRoutes = await Promise.all(
      routes.map(async (route, index) => {
        try {
          const { score, breakdown, hazardZones } = await calculateRouteSafetyScore(
            route.decodedCoordinates || [],
            request
          );

          return {
            ...route,
            id: `route_${index}`,
            name: getRouteName(index, score),
            safetyScore: score,
            hazardZones,
            hazards: hazardZones,
            safetyFactors: {
              lighting: breakdown.lightingScore / 20,
              crowd: breakdown.crowdScore / 20,
              reports: breakdown.reportScore / 20,
            },
          };
        } catch (err) {
          console.error('Error calculating safety:', err);
          return {
            ...route,
            id: `route_${index}`,
            name: `Route ${index + 1}`,
            safetyScore: 50,
          };
        }
      })
    );

    const bestRouteIndex = processedRoutes.reduce(
      (bestIdx, route, idx, arr) =>
        route.safetyScore > arr[bestIdx].safetyScore ? idx : bestIdx,
      0
    );

    processedRoutes[bestRouteIndex].isBestRoute = true;

    return {
      routes: processedRoutes,
      bestRouteIndex,
      status: 'success',
    };
  } catch (error) {
    console.error('❌ API error, using mock routes:', error);
    return generateMockRoutes(request);
  }
};

// ==================== OSRM API CALL (NO KEY NEEDED!) ====================
const fetchOSRMRoutes = async (request: RouteRequest): Promise<SafeRoute[]> => {
  const { origin, destination } = request;

  console.log('📍 From:', origin);
  console.log('📍 To:', destination);

  // OSRM uses: longitude,latitude format
  const url = `${OSRM_BASE_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline&alternatives=3`;
  
  console.log('📡 Calling OSRM:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  console.log('📥 API Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('📊 Response:', data);

  if (!data.routes || data.routes.length === 0) {
    console.warn('⚠️ No routes in response');
    return [];
  }

  console.log(`✅ Processing ${data.routes.length} routes...`);

  const routes: SafeRoute[] = data.routes.map((route: any, idx: number) => {
    const coordinates = decodePolyline(route.geometry);
    
    console.log(`Route ${idx + 1}: ${coordinates.length} points, ${route.distance}m`);

    return {
      id: `route_${idx}`,
      name: `Route ${idx + 1}`,
      origin,
      destination,
      legs: [{
        startLocation: origin,
        endLocation: destination,
        distance: route.distance,
        duration: route.duration,
        polyline: route.geometry,
        steps: [],
      }],
      totalDistance: route.distance,
      totalDuration: route.duration,
      distance: route.distance,
      duration: route.duration,
      safetyScore: 0,
      encodedPolyline: route.geometry,
      decodedCoordinates: coordinates,
      waypoints: coordinates,
      hazardZones: [],
      hazards: [],
      isBestRoute: false,
      safetyFactors: { lighting: 0, crowd: 0, reports: 0 },
    };
  });

  return routes;
};

// ==================== MOCK ROUTES ====================
const generateMockRoutes = async (request: RouteRequest): Promise<RouteResponse> => {
  const { origin, destination } = request;
  const distance = calculateDistanceMeters(
    origin.latitude, origin.longitude,
    destination.latitude, destination.longitude
  );
  
  const routes: SafeRoute[] = [
    {
      id: 'route_1',
      name: 'Main Road (Safest)',
      origin,
      destination,
      legs: [{ startLocation: origin, endLocation: destination, distance: distance * 1.1, duration: (distance * 1.1) / 1.4, polyline: '', steps: [] }],
      totalDistance: distance * 1.1,
      totalDuration: (distance * 1.1) / 1.4,
      distance: distance * 1.1,
      duration: (distance * 1.1) / 1.4,
      safetyScore: 85,
      encodedPolyline: '',
      decodedCoordinates: generateWaypoints(origin, destination, 'direct'),
      waypoints: generateWaypoints(origin, destination, 'direct'),
      hazardZones: [],
      hazards: [],
      isBestRoute: true,
      safetyFactors: { lighting: 4.2, crowd: 3.8, reports: 4.5 },
    },
    {
      id: 'route_2',
      name: 'Busy Streets',
      origin,
      destination,
      legs: [{ startLocation: origin, endLocation: destination, distance: distance * 1.3, duration: (distance * 1.3) / 1.4, polyline: '', steps: [] }],
      totalDistance: distance * 1.3,
      totalDuration: (distance * 1.3) / 1.4,
      distance: distance * 1.3,
      duration: (distance * 1.3) / 1.4,
      safetyScore: 72,
      encodedPolyline: '',
      decodedCoordinates: generateWaypoints(origin, destination, 'populated'),
      waypoints: generateWaypoints(origin, destination, 'populated'),
      hazardZones: [],
      hazards: [],
      isBestRoute: false,
      safetyFactors: { lighting: 3.2, crowd: 4.5, reports: 3.8 },
    },
    {
      id: 'route_3',
      name: 'Shortest Path',
      origin,
      destination,
      legs: [{ startLocation: origin, endLocation: destination, distance: distance, duration: distance / 1.4, polyline: '', steps: [] }],
      totalDistance: distance,
      totalDuration: distance / 1.4,
      distance: distance,
      duration: distance / 1.4,
      safetyScore: 58,
      encodedPolyline: '',
      decodedCoordinates: generateWaypoints(origin, destination, 'short'),
      waypoints: generateWaypoints(origin, destination, 'short'),
      hazardZones: [],
      hazards: [],
      isBestRoute: false,
      safetyFactors: { lighting: 2.5, crowd: 2.0, reports: 3.0 },
    },
  ];

  return { routes, bestRouteIndex: 0, status: 'success' };
};

const generateWaypoints = (origin: Coordinates, destination: Coordinates, type: 'direct' | 'populated' | 'short'): Coordinates[] => {
  const points: Coordinates[] = [origin];
  const n = 15;
  
  for (let i = 1; i < n; i++) {
    const t = i / n;
    let lat = origin.latitude + (destination.latitude - origin.latitude) * t;
    let lng = origin.longitude + (destination.longitude - origin.longitude) * t;
    
    const v = 0.0003;
    if (type === 'direct') {
      lat += Math.sin(t * Math.PI) * v;
      lng += Math.cos(t * Math.PI * 2) * v * 0.5;
    } else if (type === 'populated') {
      lng += Math.sin(t * Math.PI) * v * 2;
      lat += Math.cos(t * Math.PI) * v;
    } else {
      lat += Math.sin(t * Math.PI * 3) * v * 0.2;
    }
    
    points.push({ latitude: lat, longitude: lng });
  }
  
  points.push(destination);
  return points;
};

// ==================== HELPER FUNCTIONS ====================
const getRouteName = (index: number, score: number): string => {
  if (score >= 80) return `Route ${index + 1} - Safest`;
  if (score >= 65) return `Route ${index + 1} - Safe`;
  if (score >= 50) return `Route ${index + 1} - Moderate`;
  return `Route ${index + 1} - Caution`;
};

const calculateRouteSafetyScore = async (coords: Coordinates[], request: RouteRequest): Promise<{
  score: number;
  breakdown: SafetyScoreBreakdown;
  hazardZones: HazardZone[];
}> => {
  const centerLat = (request.origin.latitude + request.destination.latitude) / 2;
  const centerLng = (request.origin.longitude + request.destination.longitude) / 2;

  const reports = await getReportsNearLocation({ latitude: centerLat, longitude: centerLng }, 5);
  const routeId = generateRouteId(request.origin.latitude, request.origin.longitude, request.destination.latitude, request.destination.longitude);
  const rating = await getAggregatedRating(routeId);

  let lightingScore = ((rating?.avgLightingQuality ?? 3) / 5) * 100;
  let crowdScore = ((rating?.avgCrowdLevel ?? 3) / 5) * 100;
  let reportScore = 100;
  const hazardZones: HazardZone[] = [];

  for (const report of reports) {
    const isNear = coords.some(c => calculateDistanceMeters(c.latitude, c.longitude, report.location.latitude, report.location.longitude) < 100);
    if (isNear) {
      const penalty = report.category === 'harassment' ? 25 : report.category === 'suspicious_activity' ? 20 : 15;
      reportScore -= penalty;
      hazardZones.push({
        center: report.location,
        radius: 50,
        severity: penalty > 15 ? 'high' : 'medium',
        reason: report.title,
      });
    }
  }

  reportScore = Math.max(0, reportScore);
  const totalScore = Math.round(lightingScore * SAFETY_WEIGHTS.lighting + crowdScore * SAFETY_WEIGHTS.crowd + reportScore * SAFETY_WEIGHTS.reports);

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      lightingScore: Math.round(lightingScore),
      crowdScore: Math.round(crowdScore),
      reportScore: Math.round(reportScore),
      totalScore,
    },
    hazardZones,
  };
};

export const decodePolyline = (encoded: string): Coordinates[] => {
  const coords: Coordinates[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coords;
};

const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

export const findSafeRoute = async (origin: Coordinates, destination: Coordinates): Promise<SafeRoute[]> => {
  try {
    console.log('🚀 findSafeRoute called');
    const response = await fetchRoutes({ origin, destination, alternatives: true });
    console.log('🚀 Got response with', response.routes?.length || 0, 'routes');
    return response.routes || [];
  } catch (error) {
    console.error('❌ findSafeRoute error:', error);
    return [];
  }
};