/**
 * useChat Hook
 * Unified hook that switches between socket and API based on enableSocketFlag
 */

import { isSocketEnabled } from '../../../config/appConfig';
import { useSocket } from '../../socket/hooks/useSocket';
import { useApiChat } from './useApiChat';
import {
  IncomingChatMessage,
  SocketErrorPayload,
  ConsultationOfferPayload,
  SocketConnectionInfo,
} from '../../socket/types/socketTypes';
import { SocketConnectionState } from '../../socket/config/socketConfig';

interface UseChatOptions {
  sessionToken: string;
  autoConnect?: boolean;
  onMessage?: (message: IncomingChatMessage) => void;
  onAIResponse?: (response: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onError?: (error: SocketErrorPayload) => void;
  onConsultationOffer?: (payload: ConsultationOfferPayload) => void;
}

interface UseChatReturn {
  isConnected: boolean;
  connectionState: SocketConnectionState;
  connectionInfo: SocketConnectionInfo;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string, senderId: string) => boolean;
  sendTextMessage: (message: string) => boolean;
  sendTypingIndicator: (userId: string, isTyping: boolean) => boolean;
  error: SocketErrorPayload | null;
  /** Indicates whether socket mode is being used */
  isSocketMode: boolean;
}

// Determine socket mode at module load time (constant during app lifecycle)
const SOCKET_MODE_ENABLED = isSocketEnabled();

/**
 * Unified chat hook that automatically selects between socket and API mode
 * based on the enableSocketFlag configuration
 * 
 * @param options - Chat options including session token and callbacks
 * @returns Chat interface with connection management and messaging functions
 */
export const useChat = (options: UseChatOptions): UseChatReturn => {
  console.log('[useChat] Using socket mode:', SOCKET_MODE_ENABLED);

  // Use the appropriate hook based on the flag
  // Note: We call both hooks but only use the result from the enabled one
  // This is because React hooks must be called in the same order every render
  const socketHook = useSocket({
    ...options,
    // Disable auto-connect for socket if we're in API mode
    autoConnect: SOCKET_MODE_ENABLED ? options.autoConnect : false,
  });
  
  const apiHook = useApiChat({
    ...options,
    // Disable auto-connect for API if we're in socket mode
    autoConnect: !SOCKET_MODE_ENABLED ? options.autoConnect : false,
  });

  // Return the appropriate hook result based on the flag
  if (SOCKET_MODE_ENABLED) {
    return {
      ...socketHook,
      isSocketMode: true,
    };
  } else {
    return {
      ...apiHook,
      isSocketMode: false,
    };
  }
};

export default useChat;
