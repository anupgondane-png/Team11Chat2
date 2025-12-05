/**
 * Chat Types
 * Type definitions for API-based chat communication
 */

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'doctor';
  timestamp: Date;
  messageType?: 'text' | 'image' | 'file';
}

/**
 * Send message request payload
 */
export interface SendMessageRequest {
  session_token: string;
  message_code: number;
  message_type: string;
  text: string;
  timestamp: string;
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

/**
 * AI Response from API
 */
export interface AIMessageResponse {
  message_code: number;
  message_type: string;
  text: string;
  timestamp: string;
  message_id?: string;
  conversation_id?: string;
}

/**
 * Get messages response
 */
export interface GetMessagesResponse {
  success: boolean;
  messages?: AIMessageResponse[];
  has_more?: boolean;
  error?: string;
}

/**
 * Chat API error
 */
export interface ChatApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Chat connection state (for API mode)
 */
export type ChatConnectionState = 'idle' | 'polling' | 'sending' | 'error';

/**
 * Chat state for API mode
 */
export interface ChatApiState {
  isPolling: boolean;
  connectionState: ChatConnectionState;
  lastMessageId?: string;
  error: ChatApiError | null;
}

