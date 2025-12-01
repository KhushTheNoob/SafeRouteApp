import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '../types';
import { signUp, signIn, signOut, subscribeToAuthState } from '../services/authService';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user: User | null) => {
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });
    });

    return () => unsubscribe();
  }, []);

  // Sign up handler
  const handleSignUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<User | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const user = await signUp(email, password, displayName);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign up';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  // Sign in handler
  const handleSignIn = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const user = await signIn(email, password);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign in';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  // Sign out handler
  const handleSignOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await signOut();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sign out';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    clearError,
  };
};

export default useAuth;
