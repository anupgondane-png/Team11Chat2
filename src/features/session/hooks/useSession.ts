/**
 * useSession Hook
 * Custom React hook for managing session state and operations
 */

import { useState, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import {
  SessionData,
  SessionError,
  SessionState,
  UserSessionInfo,
} from '../types/sessionTypes';

interface UseSessionReturn extends SessionState {
  getSession: (userId: string) => Promise<SessionData | null>;
  createSession: (userInfo: UserSessionInfo) => Promise<SessionData | null>;
  getOrCreateSession: (userInfo: UserSessionInfo) => Promise<SessionData | null>;
  clearSession: () => void;
  clearError: () => void;
}

/**
 * Custom hook for session management
 */
export const useSession = (): UseSessionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<SessionError | null>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  /**
   * Get existing session for a user
   */
  const getSession = useCallback(async (userId: string): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.getSession(userId);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return null;
      }

      if (result.data) {
        setSession(result.data);
        setHasExistingSession(true);
      }

      setIsLoading(false);
      return result.data;
    } catch (err) {
      const sessionError: SessionError = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setError(sessionError);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Create a new session for a user
   */
  const createSession = useCallback(async (userInfo: UserSessionInfo): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.createSession({
        device_id: userInfo.deviceId || `mobile_${Date.now()}`,
        client_type: 'mobile',
        user_id: userInfo.userId,
        user_jhh_id: userInfo.userJhhId,
      });

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return null;
      }

      if (result.data) {
        setSession(result.data);
        setHasExistingSession(false);
      }

      setIsLoading(false);
      return result.data;
    } catch (err) {
      const sessionError: SessionError = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setError(sessionError);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Get or create session - first tries to get existing, then creates new
   */
  const getOrCreateSession = useCallback(async (userInfo: UserSessionInfo): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.getOrCreateSession(
        userInfo.userId,
        userInfo.userJhhId,
        userInfo.deviceId
      );

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return null;
      }

      if (result.data) {
        setSession(result.data);
        setHasExistingSession(!result.isNewSession);
      }

      setIsLoading(false);
      return result.data;
    } catch (err) {
      const sessionError: SessionError = {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setError(sessionError);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Clear current session
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setHasExistingSession(false);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    session,
    error,
    hasExistingSession,
    getSession,
    createSession,
    getOrCreateSession,
    clearSession,
    clearError,
  };
};

export default useSession;

