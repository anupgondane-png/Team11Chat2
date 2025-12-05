/**
 * Chat Feature Module
 * Exports all chat-related functionality
 */

// Configuration
export {
  CHAT_API_CONFIG,
  buildChatApiUrl,
  sendMessageUrl,
  getMessagesUrl,
  getConversationUrl,
} from './config/chatApiConfig';

// Types
export type {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  AIMessageResponse,
  GetMessagesResponse,
  ChatApiError,
  ChatConnectionState,
  ChatApiState,
} from './types/chatTypes';

// Services
export { chatApiService, ChatApiService } from './services/chatApiService';

// Hooks
export { useApiChat } from './hooks/useApiChat';
export { useChat } from './hooks/useChat';

