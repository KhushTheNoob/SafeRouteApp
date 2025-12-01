import { useState, useEffect, useCallback } from 'react';
import { Report, ReportMarker, CreateReportInput, PendingReport, Coordinates } from '../types';
import { 
  getReports, 
  getReportsNearLocation, 
  subscribeToReports,
  createReport as createReportService,
} from '../services/reportService';
import { 
  getPendingReports, 
  savePendingReport, 
  removePendingReport,
  cacheReports,
  getCachedReports,
  generateLocalId,
} from '../services/storageService';
import { formatTimeSince, calculateDistance } from '../utils';

interface UseReportsState {
  reports: Report[];
  pendingReports: PendingReport[];
  isLoading: boolean;
  error: string | null;
}

export const useReports = (userLocation?: Coordinates) => {
  const [state, setState] = useState<UseReportsState>({
    reports: [],
    pendingReports: [],
    isLoading: true,
    error: null,
  });

  // Load reports on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadReports = async () => {
      try {
        // Load pending reports from storage
        const pending = await getPendingReports();
        
        // Subscribe to real-time report updates
        unsubscribe = subscribeToReports((reports: Report[]) => {
          setState((prev) => ({
            ...prev,
            reports,
            isLoading: false,
            error: null,
          }));

          // Cache reports for offline use
          cacheReports(reports);
        });

        setState((prev) => ({
          ...prev,
          pendingReports: pending,
        }));
      } catch (error) {
        // Try to load cached reports
        const cached = await getCachedReports();
        setState((prev) => ({
          ...prev,
          reports: cached,
          isLoading: false,
          error: 'Failed to load reports. Showing cached data.',
        }));
      }
    };

    loadReports();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Create a new report
  const createReport = useCallback(
    async (input: CreateReportInput): Promise<Report | null> => {
      try {
        const report = await createReportService(input);
        return report;
      } catch (error) {
        // Save as pending report for offline sync
        const pendingReport: PendingReport = {
          ...input,
          localId: generateLocalId(),
          createdAt: Date.now(),
          isSyncing: false,
        };

        await savePendingReport(pendingReport);

        setState((prev) => ({
          ...prev,
          pendingReports: [...prev.pendingReports, pendingReport],
        }));

        return null;
      }
    },
    []
  );

  // Sync pending reports
  const syncPendingReports = useCallback(async () => {
    for (const pending of state.pendingReports) {
      if (pending.isSyncing) continue;

      try {
        await createReportService(pending);
        await removePendingReport(pending.localId);

        setState((prev) => ({
          ...prev,
          pendingReports: prev.pendingReports.filter(
            (p) => p.localId !== pending.localId
          ),
        }));
      } catch (error) {
        console.error('Failed to sync pending report:', error);
      }
    }
  }, [state.pendingReports]);

  // Get reports as markers with distance info
  const getReportMarkers = useCallback((): ReportMarker[] => {
    return state.reports.map((report) => {
      let distanceFromUser: number | undefined;

      if (userLocation) {
        distanceFromUser = calculateDistance(userLocation, report.location);
      }

      return {
        ...report,
        distanceFromUser,
        timeSincePosted: formatTimeSince(report.createdAt),
      };
    });
  }, [state.reports, userLocation]);

  // Refresh reports
  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const reports = await getReports();
      setState((prev) => ({
        ...prev,
        reports,
        isLoading: false,
        error: null,
      }));

      cacheReports(reports);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh reports',
      }));
    }
  }, []);

  return {
    ...state,
    createReport,
    syncPendingReports,
    getReportMarkers,
    refresh,
  };
};

export default useReports;
