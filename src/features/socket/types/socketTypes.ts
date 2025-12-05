/**
 * Socket Types
 * Type definitions for socket messages and events
 */

import { SocketConnectionState, SocketMessageType } from '../config/socketConfig';

/**
 * Base socket message interface
 */
export interface SocketMessage {
  type: SocketMessageType | string;
  payload?: unknown;
  timestamp?: number;
  messageId?: string;
  // Direct message fields (for text_message format)
  text?: string;      // Server sends AI response in 'text' field
  message?: string;
  content?: string;
}

/**
 * Text message payload - sent by user
 */
export interface TextMessagePayload {
  message: string;
}

/**
 * AI Response payload - received from server
 */
export interface AIResponsePayload {
  text?: string;      // Server sends response in 'text' field
  message?: string;
  content?: string;
  response?: string;
}

/**
 * Chat message payload (legacy)
 */
export interface ChatMessagePayload {
  content: string;
  senderId: string;
  recipientId?: string;
  messageType?: 'text' | 'image' | 'file';
}

/**
 * Incoming chat message from server
 */
export interface IncomingChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
  messageType: 'text' | 'image' | 'file';
}

/**
 * Typing indicator payload
 */
export interface TypingIndicatorPayload {
  userId: string;
  isTyping: boolean;
}

/**
 * Consultation offer payload - received when doctor consultation is being arranged
 */
export interface ConsultationOfferPayload {
  message_code: number;
  message_type: string;
  conversation_id: string;
  message: {
    header1?: string;
    header2?: string;
    header3?: string;
  };
  timestamp: string;
  trace_id: string;
  message_id?: string | null;
}

/**
 * Read receipt payload
 */
export interface ReadReceiptPayload {
  messageId: string;
  readBy: string;
  readAt: number;
}

/**
 * Socket error payload
 */
export interface SocketErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Socket connection info
 */
export interface SocketConnectionInfo {
  state: SocketConnectionState;
  reconnectAttempts: number;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  error?: SocketErrorPayload;
}

/**
 * Socket event handlers
 */
export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
  onMessage?: (message: SocketMessage) => void;
  onError?: (error: SocketErrorPayload) => void;
  onReconnecting?: (attempt: number) => void;
}

/**
 * Socket service options
 */
export interface SocketServiceOptions {
  sessionToken: string;
  autoReconnect?: boolean;
  eventHandlers?: SocketEventHandlers;
}

