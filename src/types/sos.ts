import { Coordinates } from './location';

// SOS alert interface
export interface SOSAlert {
  id: string;
  uid: string;
  location: Coordinates;
  timestamp: number;
  active: boolean;
  cancelledAt?: number;
  notifiedContacts: string[];
}

// Create SOS input
export interface CreateSOSInput {
  location: Coordinates;
}

// SOS state
export interface SOSState {
  isActive: boolean;
  currentAlert: SOSAlert | null;
  activationTime: number | null;
  canCancel: boolean;
}
