import { useState, useEffect, useCallback, useRef } from 'react';
import { SOSAlert, SOSState, Coordinates } from '../types';
import {
  createSOSAlert,
  cancelSOSAlert,
  updateSOSLocation,
  subscribeToSOSAlert,
  getActiveSOSAlert,
} from '../services/sosService';
import { getCurrentUser } from '../services/authService';
import { SOS_COOLDOWN_MS } from '../config';

export const useSOS = () => {
  const [state, setState] = useState<SOSState>({
    isActive: false,
    currentAlert: null,
    activationTime: null,
    canCancel: false,
  });

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check for existing active SOS on mount
  useEffect(() => {
    const checkActiveAlert = async () => {
      const user = getCurrentUser();
      if (!user) return;

      const activeAlert = await getActiveSOSAlert(user.uid);
      if (activeAlert) {
        setState({
          isActive: true,
          currentAlert: activeAlert,
          activationTime: activeAlert.timestamp,
          canCancel: true,
        });

        // Subscribe to updates
        unsubscribeRef.current = subscribeToSOSAlert(
          activeAlert.id,
          (alert: SOSAlert | null) => {
            if (alert && alert.active) {
              setState((prev) => ({
                ...prev,
                currentAlert: alert,
              }));
            } else {
              setState({
                isActive: false,
                currentAlert: null,
                activationTime: null,
                canCancel: false,
              });
            }
          }
        );
      }
    };

    checkActiveAlert();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  // Activate SOS
  const activateSOS = useCallback(
    async (location: Coordinates): Promise<SOSAlert | null> => {
      try {
        const alert = await createSOSAlert({ location });

        setState({
          isActive: true,
          currentAlert: alert,
          activationTime: Date.now(),
          canCancel: false,
        });

        // Start cooldown timer for cancel
        cooldownTimerRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, canCancel: true }));
        }, SOS_COOLDOWN_MS);

        // Subscribe to updates
        unsubscribeRef.current = subscribeToSOSAlert(
          alert.id,
          (updatedAlert: SOSAlert | null) => {
            if (updatedAlert && updatedAlert.active) {
              setState((prev) => ({
                ...prev,
                currentAlert: updatedAlert,
              }));
            } else {
              setState({
                isActive: false,
                currentAlert: null,
                activationTime: null,
                canCancel: false,
              });
            }
          }
        );

        return alert;
      } catch (error) {
        console.error('Failed to activate SOS:', error);
        return null;
      }
    },
    []
  );

  // Cancel SOS
  const deactivateSOS = useCallback(async (): Promise<boolean> => {
    if (!state.currentAlert || !state.canCancel) {
      return false;
    }

    try {
      await cancelSOSAlert(state.currentAlert.id);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }

      setState({
        isActive: false,
        currentAlert: null,
        activationTime: null,
        canCancel: false,
      });

      return true;
    } catch (error) {
      console.error('Failed to cancel SOS:', error);
      return false;
    }
  }, [state.currentAlert, state.canCancel]);

  // Update SOS location
  const updateLocation = useCallback(
    async (location: Coordinates): Promise<void> => {
      if (!state.currentAlert) return;

      try {
        await updateSOSLocation(state.currentAlert.id, location);
      } catch (error) {
        console.error('Failed to update SOS location:', error);
      }
    },
    [state.currentAlert]
  );

  // Calculate remaining cooldown time
  const getRemainingCooldown = useCallback((): number => {
    if (!state.activationTime || state.canCancel) {
      return 0;
    }

    const elapsed = Date.now() - state.activationTime;
    const remaining = SOS_COOLDOWN_MS - elapsed;

    return Math.max(0, remaining);
  }, [state.activationTime, state.canCancel]);

  return {
    ...state,
    activateSOS,
    deactivateSOS,
    updateLocation,
    getRemainingCooldown,
  };
};

export default useSOS;
