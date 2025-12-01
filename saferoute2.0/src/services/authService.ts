import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDB } from './firebase';
import { User } from '../types';
import { COLLECTIONS } from '../config';

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Update display name
  await updateProfile(firebaseUser, { displayName });

  // Create user document in Firestore
  const userData: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || email,
    displayName,
    phoneNumber: firebaseUser.phoneNumber,
    photoURL: firebaseUser.photoURL,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });

  return userData;
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Get user data from Firestore
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  // If no user document, create one
  const userData: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || email,
    displayName: firebaseUser.displayName,
    phoneNumber: firebaseUser.phoneNumber,
    photoURL: firebaseUser.photoURL,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);

  return userData;
};

// Sign out
export const signOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  const auth = getFirebaseAuth();
  return auth.currentUser;
};

// Subscribe to auth state changes
export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Get full user data from Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));

      if (userDoc.exists()) {
        callback(userDoc.data() as User);
      } else {
        // Create basic user object
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          phoneNumber: firebaseUser.phoneNumber,
          photoURL: firebaseUser.photoURL,
          createdAt: Date.now(),
        });
      }
    } else {
      callback(null);
    }
  });
};

// Convert Firebase user to app User
export const firebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName,
  phoneNumber: firebaseUser.phoneNumber,
  photoURL: firebaseUser.photoURL,
  createdAt: Date.now(),
});
