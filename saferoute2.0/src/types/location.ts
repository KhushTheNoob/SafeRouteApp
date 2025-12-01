// Location types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithTimestamp extends Coordinates {
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface LocationState {
  currentLocation: LocationWithTimestamp | null;
  isTracking: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  error: string | null;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
