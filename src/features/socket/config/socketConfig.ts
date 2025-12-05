/**
 * Socket Configuration
 * Contains all WebSocket connection configuration
 */

export const SOCKET_CONFIG = {
  // Base WebSocket URL
  BASE_URL: 'wss://api.rep.health.jiolabs.com',
  
  // Service path
  SERVICE_PATH: '/jh-jio-doctor-service',
  
  // WebSocket endpoint
  WS_ENDPOINT: '/ws/chat',
  
  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // Ping/Pong settings for keeping connection alive
  PING_INTERVAL: 30000, // 30 seconds
  PONG_TIMEOUT: 10000, // 10 seconds
  
  // Connection timeout
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Build the complete WebSocket URL with session token
 * @param sessionToken - The JWT session token for authentication
 * @returns Complete WebSocket URL
 */
export const buildSocketUrl = (sessionToken: string): string => {
  const { BASE_URL, SERVICE_PATH, WS_ENDPOINT } = SOCKET_CONFIG;
  return `${BASE_URL}${SERVICE_PATH}${WS_ENDPOINT}?session_token=${sessionToken}`;
};

/**
 * Socket message types for the chat application
 */
export enum SocketMessageType {
  // Client to Server - User sends text message
  TEXT_MESSAGE = 'text_message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  READ_RECEIPT = 'read_receipt',
  
  // Server to Client - AI responds
  AI_RESPONSE = 'ai_response',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_DELIVERED = 'message_delivered',
  USER_TYPING = 'user_typing',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  ERROR = 'error',
  
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  
  // Legacy support
  CHAT_MESSAGE = 'chat_message',
}

/**
 * Socket connection states
 */
export enum SocketConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

