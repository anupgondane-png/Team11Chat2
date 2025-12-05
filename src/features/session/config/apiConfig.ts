/**
 * API Configuration
 * Contains all API endpoint configurations
 */

export const API_CONFIG = {
  // Base API URL
  BASE_URL: 'https://api.rep.health.jiolabs.com',
  
  // Service path
  SERVICE_PATH: '/jh-jio-doctor-service',
  
  // API version
  API_VERSION: '/api/v1',
  
  // Endpoints
  ENDPOINTS: {
    GET_SESSION: '/get_session',
    CREATE_SESSION: '/session',
  },
  
  // Request timeout
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Build the complete API URL for an endpoint
 * @param endpoint - The endpoint path
 * @returns Complete API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const { BASE_URL, SERVICE_PATH, API_VERSION } = API_CONFIG;
  return `${BASE_URL}${SERVICE_PATH}${API_VERSION}${endpoint}`;
};

/**
 * Get Session API URL with user_id query parameter
 * @param userId - The user ID
 * @returns Complete Get Session API URL
 */
export const getSessionUrl = (userId: string): string => {
  return `${buildApiUrl(API_CONFIG.ENDPOINTS.GET_SESSION)}?user_id=${userId}`;
};

/**
 * Create Session API URL
 * @returns Complete Create Session API URL
 */
export const createSessionUrl = (): string => {
  return buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_SESSION);
};

