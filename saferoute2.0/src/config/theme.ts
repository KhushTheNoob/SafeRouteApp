// SafeRoute Night-mode Color Theme
export const colors = {
  // Primary colors
  primary: '#00D4AA', // Teal accent
  primaryDark: '#00A88A',
  primaryLight: '#33DDB8',

  // Secondary colors
  secondary: '#3B82F6', // Blue
  secondaryDark: '#2563EB',
  secondaryLight: '#60A5FA',

  // Background colors (dark mode)
  background: '#0A1628', // Dark navy
  backgroundLight: '#1A2744',
  backgroundCard: '#1E3A5F',
  
  // Surface colors
  surface: '#152238',
  surfaceLight: '#1E3A5F',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // SOS specific
  sosRed: '#DC2626',
  sosRedDark: '#B91C1C',
  
  // Map overlay colors
  safeZone: 'rgba(16, 185, 129, 0.3)',
  cautionZone: 'rgba(245, 158, 11, 0.3)',
  dangerZone: 'rgba(239, 68, 68, 0.3)',
  
  // Crowd density colors
  crowdLow: 'rgba(239, 68, 68, 0.4)', // Red - empty/dangerous
  crowdMedium: 'rgba(245, 158, 11, 0.4)', // Yellow - moderate
  crowdHigh: 'rgba(16, 185, 129, 0.4)', // Green - busy/safe
  
  // Route colors
  safeRoute: '#10B981',
  alternativeRoute: '#60A5FA',
  dangerousRoute: '#EF4444',
  
  // Border colors
  border: '#2D3748',
  borderLight: '#4A5568',
  
  // Common colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Font sizes
export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 36,
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
  full: 9999,
};

// Shadow for elevated components
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

// Map dark style for Google Maps
export const mapDarkStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0A1628' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0A1628' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1E3A5F' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2D3748' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2D3748' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#152238' }],
  },
];

export default {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
};
