// Trusted contact interface
export interface TrustedContact {
  id: string;
  userId: string; // Owner of this contact
  contactUserId?: string; // If contact is also a user
  name: string;
  phoneNumber: string;
  email?: string;
  isVerified: boolean;
  canTrack: boolean; // Permission to track in Walk With Me
  createdAt: number;
  invitationSentAt?: number;
  invitationAcceptedAt?: number;
}

// Create contact input
export interface CreateContactInput {
  name: string;
  phoneNumber: string;
  email?: string;
}

// Invitation link
export interface ContactInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toPhoneNumber: string;
  toEmail?: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'expired';
}
