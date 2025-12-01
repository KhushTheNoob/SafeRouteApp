// App-wide constants
export const APP_NAME = 'SafeRoute';

// ==================== ROUTING API CONFIGURATION ====================
// Mapbox - Free routing API (100,000 requests/month)
// Sign up at: https://account.mapbox.com/auth/signup/
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example'; // Replace with your token
export const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

// OpenRouteService (backup)
export const OPENROUTE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk5YThkZGRhZjkzOTRiY2NhZWUzOGIyNGIzMGJkNWNkIiwiaCI6Im11cm11cjY0In0=' as string;
export const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org';
export const OPENROUTE_DIRECTIONS_URL = `${OPENROUTE_BASE_URL}/v2/directions/foot-walking`;

// Which API to use
export const USE_MAPBOX = false; // Set to true after getting Mapbox token

// Google Maps (optional - only for map display, not routing)
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Optional
export const GOOGLE_DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';

// ==================== LOCATION SETTINGS ====================
// Location tracking intervals (in milliseconds)
export const LOCATION_UPDATE_INTERVAL = 2000; // 2 seconds for Walk With Me
export const LOCATION_DISTANCE_FILTER = 5; // 5 meters minimum movement

// Map default settings
export const MAP_DEFAULT_ZOOM = 15;
export const MAP_DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// ==================== SAFETY CONFIGURATION ====================
// Report categories
export const REPORT_CATEGORIES = [
  { id: 'dark_spot', label: 'Dark Spot', icon: 'flashlight-off' },
  { id: 'stray_dog', label: 'Stray Dog', icon: 'dog' },
  { id: 'harassment', label: 'Harassment', icon: 'alert-circle' },
  { id: 'light_failure', label: 'Light Failure', icon: 'lightbulb-off' },
  { id: 'suspicious_activity', label: 'Suspicious Activity', icon: 'eye-off' },
] as const;

// Safety score weights (must sum to 1.0)
export const SAFETY_WEIGHTS = {
  lighting: 0.35,  // Street lighting quality
  crowd: 0.30,     // Pedestrian density
  reports: 0.35,   // Community safety reports
};

// Rating scales
export const RATING_MAX = 5;
export const SAFETY_SCORE_MAX = 100;

// Crowd density levels
export const CROWD_LEVELS = {
  LOW: { min: 0, max: 33, label: 'Low', color: 'crowdLow' },
  MEDIUM: { min: 34, max: 66, label: 'Medium', color: 'crowdMedium' },
  HIGH: { min: 67, max: 100, label: 'High', color: 'crowdHigh' },
} as const;

// ==================== SOS SETTINGS ====================
export const SOS_COOLDOWN_MS = 10000; // 10 seconds before allowing cancel

// ==================== DATABASE CONFIGURATION ====================
// Firestore collection names
export const COLLECTIONS = {
  REPORTS: 'reports',
  ROAD_RATINGS: 'roadRatings',
  SOS_ALERTS: 'sosAlerts',
  USERS: 'users',
  TRUSTED_CONTACTS: 'trustedContacts',
} as const;

// Realtime Database paths
export const RTDB_PATHS = {
  WALK_WITH_ME: 'walkWithMe',
  LIVE_LOCATIONS: 'liveLocations',
} as const;

// ==================== STORAGE KEYS ====================
// Offline storage keys
export const STORAGE_KEYS = {
  PENDING_REPORTS: '@SafeRoute:pendingReports',
  USER_PREFERENCES: '@SafeRoute:userPreferences',
  CACHED_REPORTS: '@SafeRoute:cachedReports',
} as const;

// ==================== CLUSTERING SETTINGS ====================
// Marker clustering settings
export const CLUSTER_SETTINGS = {
  radius: 50,
  maxZoom: 20,
  minZoom: 1,
  extent: 512,
  nodeSize: 64,
};

// ==================== ROUTE VISUALIZATION ====================
// Route display settings
export const ROUTE_COLORS = {
  SAFE: '#22c55e',      // Green for safe routes (score >= 80)
  MODERATE: '#f59e0b',  // Orange for moderate routes (score 50-79)
  UNSAFE: '#ef4444',    // Red for unsafe routes (score < 50)
  UNSELECTED: '#64748b80', // Gray with transparency for non-selected routes
};

export const ROUTE_STROKE_WIDTH = {
  SELECTED: 5,
  UNSELECTED: 3,
};