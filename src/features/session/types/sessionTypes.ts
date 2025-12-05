/**
 * Session Types
 * Type definitions for session API requests and responses
 */

/**
 * Create Session Request payload
 */
export interface CreateSessionRequest {
  device_id: string;
  client_type: 'mobile' | 'web';
  user_id: string;
  user_jhh_id: string;
}

/**
 * Session data from API response
 */
export interface SessionData {
  session_id: string;
  session_token: string;
  user_id: string;
  created_at?: string;
  expires_at?: string;
  correlation_id?: string;
  conversation_id?: string;
  expires_in?: number;
}

/**
 * Get Session API Response
 */
export interface GetSessionResponse {
  success: boolean;
  data?: SessionData;
  message?: string;
  error?: string;
}

/**
 * Create Session API Response
 */
export interface CreateSessionResponse {
  success: boolean;
  data?: SessionData;
  message?: string;
  error?: string;
}

/**
 * Session state for the hook
 */
export interface SessionState {
  isLoading: boolean;
  session: SessionData | null;
  error: SessionError | null;
  hasExistingSession: boolean;
}

/**
 * Session error
 */
export interface SessionError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * User info required for session operations
 */
export interface UserSessionInfo {
  userId: string;
  userJhhId: string;
  deviceId?: string;
}

