import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDB } from './firebase';
import { SOSAlert, CreateSOSInput, Coordinates } from '../types';
import { COLLECTIONS } from '../config';
import { getCurrentUser } from './authService';

// Create SOS alert
export const createSOSAlert = async (input: CreateSOSInput): Promise<SOSAlert> => {
  const db = getFirestoreDB();
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be authenticated to create SOS alert');
  }

  const sosData = {
    uid: user.uid,
    location: {
      latitude: input.location.latitude,
      longitude: input.location.longitude,
    },
    timestamp: serverTimestamp(),
    active: true,
    notifiedContacts: [],
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SOS_ALERTS), sosData);

  return {
    id: docRef.id,
    uid: user.uid,
    location: input.location,
    timestamp: Date.now(),
    active: true,
    notifiedContacts: [],
  };
};

// Cancel SOS alert
export const cancelSOSAlert = async (alertId: string): Promise<void> => {
  const db = getFirestoreDB();

  await updateDoc(doc(db, COLLECTIONS.SOS_ALERTS, alertId), {
    active: false,
    cancelledAt: serverTimestamp(),
  });
};

// Update SOS location
export const updateSOSLocation = async (
  alertId: string,
  location: Coordinates
): Promise<void> => {
  const db = getFirestoreDB();

  await updateDoc(doc(db, COLLECTIONS.SOS_ALERTS, alertId), {
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
  });
};

// Get active SOS alert for user
export const getActiveSOSAlert = async (userId: string): Promise<SOSAlert | null> => {
  const db = getFirestoreDB();

  const sosQuery = query(
    collection(db, COLLECTIONS.SOS_ALERTS),
    where('uid', '==', userId),
    where('active', '==', true)
  );

  const snapshot = await (await import('firebase/firestore')).getDocs(sosQuery);

  if (snapshot.empty) {
    return null;
  }

  const docSnapshot = snapshot.docs[0];
  const data = docSnapshot.data();
  const timestamp = data.timestamp as Timestamp;

  return {
    id: docSnapshot.id,
    uid: data.uid,
    location: data.location,
    timestamp: timestamp?.toMillis() || Date.now(),
    active: data.active,
    notifiedContacts: data.notifiedContacts || [],
  };
};

// Get SOS alert by ID
export const getSOSAlertById = async (alertId: string): Promise<SOSAlert | null> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  const timestamp = data.timestamp as Timestamp;

  return {
    id: docSnap.id,
    uid: data.uid,
    location: data.location,
    timestamp: timestamp?.toMillis() || Date.now(),
    active: data.active,
    cancelledAt: data.cancelledAt?.toMillis(),
    notifiedContacts: data.notifiedContacts || [],
  };
};

// Subscribe to SOS alert updates
export const subscribeToSOSAlert = (
  alertId: string,
  callback: (alert: SOSAlert | null) => void
): (() => void) => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);

  return onSnapshot(docRef, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null);
      return;
    }

    const data = docSnapshot.data();
    const timestamp = data.timestamp as Timestamp;

    callback({
      id: docSnapshot.id,
      uid: data.uid,
      location: data.location,
      timestamp: timestamp?.toMillis() || Date.now(),
      active: data.active,
      cancelledAt: data.cancelledAt?.toMillis(),
      notifiedContacts: data.notifiedContacts || [],
    });
  });
};

// Add notified contact to SOS alert
export const addNotifiedContact = async (
  alertId: string,
  contactId: string
): Promise<void> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentContacts = docSnap.data().notifiedContacts || [];
    if (!currentContacts.includes(contactId)) {
      await updateDoc(docRef, {
        notifiedContacts: [...currentContacts, contactId],
      });
    }
  }
};
