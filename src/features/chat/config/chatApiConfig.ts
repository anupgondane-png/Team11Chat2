/**
 * Chat API Configuration
 * Contains all chat API endpoint configurations for API-based communication
 */

export const CHAT_API_CONFIG = {
  // Base API URL
  BASE_URL: 'https://api.rep.health.jiolabs.com',
  
  // Service path
  SERVICE_PATH: '/jh-jio-doctor-service',
  
  // API version
  API_VERSION: '/api/v1',
  
  // Endpoints
  ENDPOINTS: {
    SEND_MESSAGE: '/message',
    GET_MESSAGES: '/messages',
    GET_CONVERSATION: '/conversation',
  },
  
  // Request timeout
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Build the complete API URL for an endpoint
 * @param endpoint - The endpoint path
 * @returns Complete API URL
 */
export const buildChatApiUrl = (endpoint: string): string => {
  const { BASE_URL, SERVICE_PATH, API_VERSION } = CHAT_API_CONFIG;
  return `${BASE_URL}${SERVICE_PATH}${API_VERSION}${endpoint}`;
};

/**
 * Send Message API URL
 * @returns Complete Send Message API URL
 */
export const sendMessageUrl = (): string => {
  return buildChatApiUrl(CHAT_API_CONFIG.ENDPOINTS.SEND_MESSAGE);
};

/**
 * Get Messages API URL with session token
 * @param sessionToken - The session token
 * @param lastMessageId - Optional last message ID for pagination
 * @returns Complete Get Messages API URL
 */
export const getMessagesUrl = (sessionToken: string, lastMessageId?: string): string => {
  let url = `${buildChatApiUrl(CHAT_API_CONFIG.ENDPOINTS.GET_MESSAGES)}?session_token=${sessionToken}`;
  if (lastMessageId) {
    url += `&last_message_id=${lastMessageId}`;
  }
  return url;
};

/**
 * Get Conversation API URL
 * @param conversationId - The conversation ID
 * @returns Complete Get Conversation API URL
 */
export const getConversationUrl = (conversationId: string): string => {
  return `${buildChatApiUrl(CHAT_API_CONFIG.ENDPOINTS.GET_CONVERSATION)}/${conversationId}`;
};

