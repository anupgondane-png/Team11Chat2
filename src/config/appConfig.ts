/**
 * Application Configuration
 * Central configuration for app-wide settings
 */

export const APP_CONFIG = {
  /**
   * Enable Socket Flag
   * 
   * When true: Uses WebSocket for real-time communication (current implementation)
   * When false: Uses REST API polling for communication
   * 
   * Set this flag to control the communication mode:
   * - Socket mode: Real-time bidirectional communication via WebSocket
   * - API mode: Uses session details and pulls data from REST API endpoints
   */
  ENABLE_SOCKET: true,

  /**
   * Enable Mock API Mode
   * 
   * When true: Returns mock responses when API endpoints are not available
   * When false: Makes actual API calls (will fail if API is not deployed)
   * 
   * Use this for testing when the backend API is not yet deployed
   */
  ENABLE_MOCK_API: false,

  /**
   * API Polling interval in milliseconds (used when ENABLE_SOCKET is false)
   */
  API_POLLING_INTERVAL: 3000, // 3 seconds
} as const;

/**
 * Check if socket mode is enabled
 */
export const isSocketEnabled = (): boolean => {
  console.log('[AppConfig] ENABLE_SOCKET:', APP_CONFIG.ENABLE_SOCKET);
  return APP_CONFIG.ENABLE_SOCKET;
};

/**
 * Get API polling interval
 */
export const getApiPollingInterval = (): number => {
  return APP_CONFIG.API_POLLING_INTERVAL;
};

/**
 * Check if mock API mode is enabled
 */
export const isMockApiEnabled = (): boolean => {
  console.log('[AppConfig] ENABLE_MOCK_API:', APP_CONFIG.ENABLE_MOCK_API);
  return APP_CONFIG.ENABLE_MOCK_API;
};

