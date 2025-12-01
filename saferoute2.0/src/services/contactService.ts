import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TrustedContact,
  CreateContactInput,
  ContactInvitation,
} from '../types';

const CONTACTS_STORAGE_KEY = '@saferoute_contacts';

// Helper to generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get contacts from local storage
const getStoredContacts = async (): Promise<TrustedContact[]> => {
  try {
    const stored = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading contacts:', error);
    return [];
  }
};

// Save contacts to local storage
const saveContacts = async (contacts: TrustedContact[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts:', error);
  }
};

// Create trusted contact
export const createTrustedContact = async (
  input: CreateContactInput
): Promise<TrustedContact> => {
  const contacts = await getStoredContacts();
  
  const newContact: TrustedContact = {
    id: generateId(),
    userId: 'local-user',
    name: input.name,
    phoneNumber: input.phoneNumber,
    email: input.email,
    isVerified: false,
    canTrack: true,
    createdAt: Date.now(),
  };

  contacts.unshift(newContact);
  await saveContacts(contacts);

  return newContact;
};

// Get all trusted contacts for user
export const getTrustedContacts = async (userId?: string): Promise<TrustedContact[]> => {
  return await getStoredContacts();
};

// Get single contact by ID
export const getContactById = async (
  contactId: string
): Promise<TrustedContact | null> => {
  const contacts = await getStoredContacts();
  return contacts.find(c => c.id === contactId) || null;
};

// Update contact
export const updateContact = async (
  contactId: string,
  updates: Partial<Pick<TrustedContact, 'name' | 'phoneNumber' | 'email' | 'canTrack'>>
): Promise<void> => {
  const contacts = await getStoredContacts();
  const index = contacts.findIndex(c => c.id === contactId);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], ...updates };
    await saveContacts(contacts);
  }
};

// Delete contact
export const deleteContact = async (contactId: string): Promise<void> => {
  const contacts = await getStoredContacts();
  const filtered = contacts.filter(c => c.id !== contactId);
  await saveContacts(filtered);
};

// Send invitation to contact
export const sendContactInvitation = async (
  contactId: string
): Promise<ContactInvitation> => {
  const contact = await getContactById(contactId);

  if (!contact) {
    throw new Error('Contact not found');
  }

  const token = generateInvitationToken();

  const invitation: ContactInvitation = {
    id: generateId(),
    fromUserId: 'local-user',
    fromUserName: 'SafeRoute User',
    toPhoneNumber: contact.phoneNumber,
    toEmail: contact.email,
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    status: 'pending',
  };

  return invitation;
};

// Accept invitation
export const acceptContactInvitation = async (token: string): Promise<void> => {
  console.log('Invitation accepted:', token);
};

// Generate random invitation token
const generateInvitationToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get contacts who can track user (for Walk With Me)
export const getTrackingContacts = async (userId?: string): Promise<TrustedContact[]> => {
  const contacts = await getTrustedContacts();
  return contacts.filter((c) => c.canTrack);
};
