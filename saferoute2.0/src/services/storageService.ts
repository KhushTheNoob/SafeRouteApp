import AsyncStorage from '@react-native-async-storage/async-storage';
import { PendingReport, Report } from '../types';
import { STORAGE_KEYS } from '../config';

// Save pending report for offline sync
export const savePendingReport = async (report: PendingReport): Promise<void> => {
  try {
    const existing = await getPendingReports();
    existing.push(report);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_REPORTS, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving pending report:', error);
    throw error;
  }
};

// Get all pending reports
export const getPendingReports = async (): Promise<PendingReport[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_REPORTS);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
};

// Remove pending report after sync
export const removePendingReport = async (localId: string): Promise<void> => {
  try {
    const existing = await getPendingReports();
    const filtered = existing.filter((r) => r.localId !== localId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_REPORTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending report:', error);
    throw error;
  }
};

// Mark report as syncing
export const markReportSyncing = async (
  localId: string,
  isSyncing: boolean
): Promise<void> => {
  try {
    const existing = await getPendingReports();
    const updated = existing.map((r) =>
      r.localId === localId ? { ...r, isSyncing } : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_REPORTS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking report syncing:', error);
    throw error;
  }
};

// Cache reports for offline viewing
export const cacheReports = async (reports: Report[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_REPORTS, JSON.stringify(reports));
  } catch (error) {
    console.error('Error caching reports:', error);
  }
};

// Get cached reports
export const getCachedReports = async (): Promise<Report[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_REPORTS);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting cached reports:', error);
    return [];
  }
};

// Save user preferences
export const saveUserPreferences = async (
  preferences: Record<string, unknown>
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (): Promise<Record<string, unknown>> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error getting preferences:', error);
    return {};
  }
};

// Clear all app storage
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PENDING_REPORTS,
      STORAGE_KEYS.CACHED_REPORTS,
      STORAGE_KEYS.USER_PREFERENCES,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

// Generate unique local ID
export const generateLocalId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
