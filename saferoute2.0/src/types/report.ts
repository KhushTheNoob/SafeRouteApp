import { Coordinates } from './location';

// Report category types
export type ReportCategory =
  | 'dark_spot'
  | 'stray_dog'
  | 'harassment'
  | 'light_failure'
  | 'suspicious_activity';

// Report status
export type ReportStatus = 'active' | 'resolved' | 'expired';

// Report interface
export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  location: Coordinates;
  imageUrl?: string;
  reporterUid: string;
  createdAt: number;
  updatedAt: number;
  status: ReportStatus;
  upvotes: number;
  downvotes: number;
}

// Create report input
export interface CreateReportInput {
  title: string;
  description: string;
  category: ReportCategory;
  location: Coordinates;
  imageUri?: string;
}

// Offline pending report
export interface PendingReport extends CreateReportInput {
  localId: string;
  createdAt: number;
  isSyncing: boolean;
}

// Report marker for map display
export interface ReportMarker extends Report {
  distanceFromUser?: number;
  timeSincePosted?: string;
}

// Report category config
export interface ReportCategoryConfig {
  id: ReportCategory;
  label: string;
  icon: string;
  color: string;
}

export const REPORT_CATEGORY_CONFIG: Record<ReportCategory, ReportCategoryConfig> = {
  dark_spot: {
    id: 'dark_spot',
    label: 'Dark Spot',
    icon: 'flashlight-off',
    color: '#6B7280',
  },
  stray_dog: {
    id: 'stray_dog',
    label: 'Stray Dog',
    icon: 'paw',
    color: '#F59E0B',
  },
  harassment: {
    id: 'harassment',
    label: 'Harassment',
    icon: 'alert-circle',
    color: '#EF4444',
  },
  light_failure: {
    id: 'light_failure',
    label: 'Light Failure',
    icon: 'lightbulb-outline',
    color: '#8B5CF6',
  },
  suspicious_activity: {
    id: 'suspicious_activity',
    label: 'Suspicious Activity',
    icon: 'eye-off',
    color: '#EC4899',
  },
};
