/**
 * Session Service
 * Handles session API calls for Get Session and Create Session
 */

import { API_CONFIG, getSessionUrl, createSessionUrl } from '../config/apiConfig';
import {
  CreateSessionRequest,
  GetSessionResponse,
  CreateSessionResponse,
  SessionData,
  SessionError,
} from '../types/sessionTypes';

class SessionService {
  /**
   * Get existing session for a user
   * @param userId - The user ID to get session for
   * @returns Session data if exists, null otherwise
   */
  async getSession(userId: string): Promise<{ data: SessionData | null; error: SessionError | null }> {
    try {
      const url = getSessionUrl(userId);
      const headers = {
        'Accept': 'application/json',
      };

      // Log Request
      console.log('[SessionService] ========== GET SESSION REQUEST ==========');
      console.log('[SessionService] Method: GET');
      console.log('[SessionService] URL:', url);
      console.log('[SessionService] Headers:', JSON.stringify(headers, null, 2));
      console.log('[SessionService] Query Params: { user_id:', userId, '}');
      console.log('[SessionService] ==========================================');

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      // Log Response
      console.log('[SessionService] ========== GET SESSION RESPONSE ==========');
      console.log('[SessionService] Status:', response.status, response.statusText);
      console.log('[SessionService] Response Body:', JSON.stringify(responseData, null, 2));
      console.log('[SessionService] ===========================================');

      if (!response.ok) {
        // If 404 or no session found, return null (not an error, just no existing session)
        if (response.status === 404) {
          console.log('[SessionService] No existing session found (404)');
          return { data: null, error: null };
        }

        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: responseData.error || responseData.message || 'Failed to get session',
          },
        };
      }

      // Handle both wrapped response { success: true, data: {...} } and direct response { session_id, session_token, ... }
      let sessionData: SessionData | null = null;
      
      if (responseData.success && responseData.data) {
        // Wrapped response format
        sessionData = responseData.data;
      } else if (responseData.session_id && responseData.session_token) {
        // Direct response format from API
        sessionData = {
          session_id: responseData.session_id,
          session_token: responseData.session_token,
          user_id: responseData.user_id || userId,
          correlation_id: responseData.correlation_id,
          conversation_id: responseData.conversation_id,
          expires_in: responseData.expires_in,
        };
      }

      if (sessionData) {
        console.log('[SessionService] Session found successfully. Session ID:', sessionData.session_id);
        return { data: sessionData, error: null };
      }

      // No session exists
      return { data: null, error: null };
    } catch (error) {
      console.error('[SessionService] Get session error:', error);
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Create a new session for a user
   * @param request - Create session request payload
   * @returns New session data
   */
  async createSession(request: CreateSessionRequest): Promise<{ data: SessionData | null; error: SessionError | null }> {
    try {
      const url = createSessionUrl();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Log Request
      console.log('[SessionService] ========== CREATE SESSION REQUEST ==========');
      console.log('[SessionService] Method: POST');
      console.log('[SessionService] URL:', url);
      console.log('[SessionService] Headers:', JSON.stringify(headers, null, 2));
      console.log('[SessionService] Request Body:', JSON.stringify(request, null, 2));
      console.log('[SessionService] =============================================');

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const responseData = await response.json();

      // Log Response
      console.log('[SessionService] ========== CREATE SESSION RESPONSE ==========');
      console.log('[SessionService] Status:', response.status, response.statusText);
      console.log('[SessionService] Response Body:', JSON.stringify(responseData, null, 2));
      console.log('[SessionService] ==============================================');

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: responseData.error || responseData.message || 'Failed to create session',
          },
        };
      }

      // Handle both wrapped response { success: true, data: {...} } and direct response { session_id, session_token, ... }
      let sessionData: SessionData | null = null;
      
      if (responseData.success && responseData.data) {
        // Wrapped response format
        sessionData = responseData.data;
      } else if (responseData.session_id && responseData.session_token) {
        // Direct response format from API
        sessionData = {
          session_id: responseData.session_id,
          session_token: responseData.session_token,
          user_id: responseData.user_id || request.user_id,
          correlation_id: responseData.correlation_id,
          conversation_id: responseData.conversation_id,
          expires_in: responseData.expires_in,
        };
      }

      if (sessionData) {
        console.log('[SessionService] Session created successfully. Session ID:', sessionData.session_id);
        return { data: sessionData, error: null };
      }

      return {
        data: null,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response from create session API',
        },
      };
    } catch (error) {
      console.error('[SessionService] Create session error:', error);
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Get or create session for a user
   * First tries to get existing session, if not found creates a new one
   * @param userId - The user ID
   * @param userJhhId - The user JHH ID
   * @param deviceId - Optional device ID (defaults to generated ID)
   * @returns Session data
   */
  async getOrCreateSession(
    userId: string,
    userJhhId: string,
    deviceId?: string
  ): Promise<{ data: SessionData | null; error: SessionError | null; isNewSession: boolean }> {
    // First, try to get existing session
    const getResult = await this.getSession(userId);

    if (getResult.error) {
      return { ...getResult, isNewSession: false };
    }

    if (getResult.data) {
      console.log('[SessionService] Using existing session');
      return { data: getResult.data, error: null, isNewSession: false };
    }

    // No existing session, create a new one
    console.log('[SessionService] No existing session, creating new one');
    const createRequest: CreateSessionRequest = {
      device_id: deviceId || this.generateDeviceId(),
      client_type: 'mobile',
      user_id: userId,
      user_jhh_id: userJhhId,
    };

    const createResult = await this.createSession(createRequest);
    return { ...createResult, isNewSession: true };
  }

  /**
   * Generate a device ID
   * In production, this should be a persistent device identifier
   */
  private generateDeviceId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sessionService = new SessionService();

// Also export the class for testing purposes
export { SessionService };

