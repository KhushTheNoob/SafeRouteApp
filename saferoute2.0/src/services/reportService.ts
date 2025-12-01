import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestoreDB, getFirebaseStorage } from './firebase';
import {
  Report,
  CreateReportInput,
  ReportStatus,
  Coordinates,
} from '../types';
import { COLLECTIONS } from '../config';
import { getCurrentUser } from './authService';

// Create a new report
export const createReport = async (input: CreateReportInput): Promise<Report> => {
  const db = getFirestoreDB();
  const storage = getFirebaseStorage();
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be authenticated to create a report');
  }

  let imageUrl: string | undefined;

  // Upload image if provided
  if (input.imageUri) {
    const imageRef = ref(storage, `reports/${user.uid}/${Date.now()}.jpg`);
    const response = await fetch(input.imageUri);
    const blob = await response.blob();
    await uploadBytes(imageRef, blob);
    imageUrl = await getDownloadURL(imageRef);
  }

  const reportData = {
    title: input.title,
    description: input.description,
    category: input.category,
    location: new GeoPoint(input.location.latitude, input.location.longitude),
    imageUrl,
    reporterUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active' as ReportStatus,
    upvotes: 0,
    downvotes: 0,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), reportData);

  return {
    id: docRef.id,
    ...input,
    imageUrl,
    reporterUid: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'active',
    upvotes: 0,
    downvotes: 0,
  };
};

// Get all reports
export const getReports = async (limitCount: number = 100): Promise<Report[]> => {
  const db = getFirestoreDB();

  const reportsQuery = query(
    collection(db, COLLECTIONS.REPORTS),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(reportsQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const geoPoint = data.location as GeoPoint;
    const createdAt = data.createdAt as Timestamp;
    const updatedAt = data.updatedAt as Timestamp;

    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      location: {
        latitude: geoPoint.latitude,
        longitude: geoPoint.longitude,
      },
      imageUrl: data.imageUrl,
      reporterUid: data.reporterUid,
      createdAt: createdAt?.toMillis() || Date.now(),
      updatedAt: updatedAt?.toMillis() || Date.now(),
      status: data.status,
      upvotes: data.upvotes || 0,
      downvotes: data.downvotes || 0,
    };
  });
};

// Get reports near a location
export const getReportsNearLocation = async (
  center: Coordinates,
  radiusKm: number = 5
): Promise<Report[]> => {
  // Note: For production, use GeoFirestore for proper geo queries
  // This is a simplified version that fetches all reports and filters client-side
  const reports = await getReports(500);

  return reports.filter((report) => {
    const distance = calculateDistance(
      center.latitude,
      center.longitude,
      report.location.latitude,
      report.location.longitude
    );
    return distance <= radiusKm;
  });
};

// Get single report by ID
export const getReportById = async (reportId: string): Promise<Report | null> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  const geoPoint = data.location as GeoPoint;
  const createdAt = data.createdAt as Timestamp;
  const updatedAt = data.updatedAt as Timestamp;

  return {
    id: docSnap.id,
    title: data.title,
    description: data.description,
    category: data.category,
    location: {
      latitude: geoPoint.latitude,
      longitude: geoPoint.longitude,
    },
    imageUrl: data.imageUrl,
    reporterUid: data.reporterUid,
    createdAt: createdAt?.toMillis() || Date.now(),
    updatedAt: updatedAt?.toMillis() || Date.now(),
    status: data.status,
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
  };
};

// Subscribe to reports (real-time updates)
export const subscribeToReports = (
  callback: (reports: Report[]) => void,
  limitCount: number = 100
): (() => void) => {
  const db = getFirestoreDB();

  const reportsQuery = query(
    collection(db, COLLECTIONS.REPORTS),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(reportsQuery, (snapshot) => {
    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      const geoPoint = data.location as GeoPoint;
      const createdAt = data.createdAt as Timestamp;
      const updatedAt = data.updatedAt as Timestamp;

      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        location: {
          latitude: geoPoint.latitude,
          longitude: geoPoint.longitude,
        },
        imageUrl: data.imageUrl,
        reporterUid: data.reporterUid,
        createdAt: createdAt?.toMillis() || Date.now(),
        updatedAt: updatedAt?.toMillis() || Date.now(),
        status: data.status,
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
      };
    });

    callback(reports);
  });
};

// Upvote a report
export const upvoteReport = async (reportId: string): Promise<void> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentUpvotes = docSnap.data().upvotes || 0;
    await updateDoc(docRef, {
      upvotes: currentUpvotes + 1,
      updatedAt: serverTimestamp(),
    });
  }
};

// Downvote a report
export const downvoteReport = async (reportId: string): Promise<void> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentDownvotes = docSnap.data().downvotes || 0;
    await updateDoc(docRef, {
      downvotes: currentDownvotes + 1,
      updatedAt: serverTimestamp(),
    });
  }
};

// Mark report as resolved
export const resolveReport = async (reportId: string): Promise<void> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);

  await updateDoc(docRef, {
    status: 'resolved',
    updatedAt: serverTimestamp(),
  });
};

// Delete report
export const deleteReport = async (reportId: string): Promise<void> => {
  const db = getFirestoreDB();
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  await deleteDoc(docRef);
};

// Helper: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
