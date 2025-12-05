/**
 * Socket Feature Module
 * Exports all socket-related functionality
 */

// Configuration
export {
  SOCKET_CONFIG,
  buildSocketUrl,
  SocketMessageType,
  SocketConnectionState,
} from './config/socketConfig';

// Types
export type {
  SocketMessage,
  TextMessagePayload,
  AIResponsePayload,
  ChatMessagePayload,
  IncomingChatMessage,
  TypingIndicatorPayload,
  ReadReceiptPayload,
  SocketErrorPayload,
  SocketConnectionInfo,
  SocketEventHandlers,
  SocketServiceOptions,
} from './types/socketTypes';

// Services
export { socketService, SocketService } from './services/socketService';

// Hooks
export { useSocket } from './hooks/useSocket';

