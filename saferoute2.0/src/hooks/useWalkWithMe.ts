import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WalkSession,
  WalkWithMeState,
  TrustedContact,
  Coordinates,
  LocationWithTimestamp,
  WalkSessionStatus,
} from '../types';
import {
  createWalkSession,
  updateWalkLocation,
  endWalkSession,
  getActiveWalkSession,
  subscribeToWalkSession,
  calculateETA,
} from '../services/walkWithMeService';
import { LOCATION_UPDATE_INTERVAL } from '../config';

export const useWalkWithMe = () => {
  const [state, setState] = useState<WalkWithMeState>({
    isActive: false,
    currentSession: null,
    selectedContacts: [],
    destination: null,
    destinationName: '',
  });

  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const activeSession = await getActiveWalkSession();
      if (activeSession) {
        setState({
          isActive: true,
          currentSession: activeSession,
          selectedContacts: [],
          destination: activeSession.destination,
          destinationName: activeSession.destinationName || '',
        });

        // Subscribe to updates
        unsubscribeRef.current = subscribeToWalkSession(
          activeSession.id,
          (session: WalkSession | null) => {
            if (session && session.status === 'active') {
              setState((prev) => ({
                ...prev,
                currentSession: session,
              }));
            } else {
              setState({
                isActive: false,
                currentSession: null,
                selectedContacts: [],
                destination: null,
                destinationName: '',
              });
            }
          }
        );
      }
    };

    checkActiveSession();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  // Start walk session
  const startWalk = useCallback(
    async (
      destination: Coordinates,
      destinationName: string,
      contacts: TrustedContact[],
      currentLocation: LocationWithTimestamp
    ): Promise<WalkSession | null> => {
      try {
        const contactIds = contacts.map((c) => c.id);

        const session = await createWalkSession(
          {
            destination,
            destinationName,
            trackedContacts: contactIds,
          },
          currentLocation
        );

        setState({
          isActive: true,
          currentSession: session,
          selectedContacts: contacts,
          destination,
          destinationName,
        });

        // Subscribe to updates
        unsubscribeRef.current = subscribeToWalkSession(
          session.id,
          (updatedSession: WalkSession | null) => {
            if (updatedSession && updatedSession.status === 'active') {
              setState((prev) => ({
                ...prev,
                currentSession: updatedSession,
              }));
            }
          }
        );

        return session;
      } catch (error) {
        console.error('Failed to start walk:', error);
        return null;
      }
    },
    []
  );

  // Update location during walk
  const updateLocation = useCallback(
    async (location: LocationWithTimestamp): Promise<void> => {
      if (!state.currentSession) return;

      try {
        await updateWalkLocation(state.currentSession.id, location);
      } catch (error) {
        console.error('Failed to update walk location:', error);
      }
    },
    [state.currentSession]
  );

  // End walk session
  const endWalk = useCallback(
    async (status: WalkSessionStatus = 'completed'): Promise<boolean> => {
      if (!state.currentSession) return false;

      try {
        await endWalkSession(state.currentSession.id, status);

        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }

        if (locationUpdateIntervalRef.current) {
          clearInterval(locationUpdateIntervalRef.current);
          locationUpdateIntervalRef.current = null;
        }

        setState({
          isActive: false,
          currentSession: null,
          selectedContacts: [],
          destination: null,
          destinationName: '',
        });

        return true;
      } catch (error) {
        console.error('Failed to end walk:', error);
        return false;
      }
    },
    [state.currentSession]
  );

  // Set destination
  const setDestination = useCallback(
    (destination: Coordinates, name: string) => {
      setState((prev) => ({
        ...prev,
        destination,
        destinationName: name,
      }));
    },
    []
  );

  // Set selected contacts
  const setSelectedContacts = useCallback((contacts: TrustedContact[]) => {
    setState((prev) => ({
      ...prev,
      selectedContacts: contacts,
    }));
  }, []);

  // Get ETA
  const getETA = useCallback((): number | null => {
    if (!state.currentSession || !state.destination) {
      return null;
    }

    return calculateETA(state.currentSession.currentLocation, state.destination);
  }, [state.currentSession, state.destination]);

  return {
    ...state,
    // Aliases for backward compatibility
    session: state.currentSession,
    startSession: startWalk,
    endSession: endWalk,
    isLoading: false,
    startWalk,
    updateLocation,
    endWalk,
    setDestination,
    setSelectedContacts,
    getETA,
  };
};

export default useWalkWithMe;
