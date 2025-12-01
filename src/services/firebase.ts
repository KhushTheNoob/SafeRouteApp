import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase';

// Firebase app instance
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let storage: FirebaseStorage;

// Initialize Firebase
export const initializeFirebase = (): FirebaseApp => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
};

// Get Firebase Auth instance
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const app = initializeFirebase();
    auth = getAuth(app);
  }
  return auth;
};

// Get Firestore instance
export const getFirestoreDB = (): Firestore => {
  if (!db) {
    const app = initializeFirebase();
    db = getFirestore(app);
  }
  return db;
};

// Get Realtime Database instance
export const getRealtimeDB = (): Database => {
  if (!rtdb) {
    const app = initializeFirebase();
    rtdb = getDatabase(app);
  }
  return rtdb;
};

// Get Storage instance
export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    const app = initializeFirebase();
    storage = getStorage(app);
  }
  return storage;
};

// Export all
export { app, auth, db, rtdb, storage };
