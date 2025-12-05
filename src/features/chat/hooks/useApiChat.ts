/**
 * useApiChat Hook
 * Custom React hook for managing API-based chat communication
 * Used when socket mode is disabled (enableSocketFlag = false)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApiService } from '../services/chatApiService';
import { getApiPollingInterval } from '../../../config/appConfig';
import {
  ChatMessage,
  ChatApiError,
  ChatConnectionState,
  AIMessageResponse,
} from '../types/chatTypes';
import {
  IncomingChatMessage,
  SocketErrorPayload,
  ConsultationOfferPayload,
} from '../../socket/types/socketTypes';
import { SocketConnectionState } from '../../socket/config/socketConfig';

interface UseApiChatOptions {
  sessionToken: string;
  autoConnect?: boolean;
  onMessage?: (message: IncomingChatMessage) => void;
  onAIResponse?: (response: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onError?: (error: SocketErrorPayload) => void;
  onConsultationOffer?: (payload: ConsultationOfferPayload) => void;
}

interface UseApiChatReturn {
  isConnected: boolean;
  connectionState: SocketConnectionState;
  connectionInfo: {
    state: SocketConnectionState;
    reconnectAttempts: number;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string, senderId: string) => boolean;
  sendTextMessage: (message: string) => boolean;
  sendTypingIndicator: (userId: string, isTyping: boolean) => boolean;
  error: SocketErrorPayload | null;
}

/**
 * Custom hook for API-based chat communication
 * Provides the same interface as useSocket for seamless switching
 */
export const useApiChat = (options: UseApiChatOptions): UseApiChatReturn => {
  const {
    sessionToken,
    autoConnect = true,
    onMessage,
    onAIResponse,
    onTyping,
    onError,
    onConsultationOffer,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    SocketConnectionState.DISCONNECTED
  );
  const [error, setError] = useState<SocketErrorPayload | null>(null);
  
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isWaitingForResponseRef = useRef(false);

  /**
   * Process AI response messages
   */
  const processAIResponse = useCallback((message: AIMessageResponse) => {
    console.log('[useApiChat] Processing AI response:', message);

    // Check for consultation offer
    if (message.message_type === 'consultation_offer') {
      console.log('[useApiChat] Consultation offer received');
      if (onConsultationOffer) {
        onConsultationOffer(message as unknown as ConsultationOfferPayload);
      }
      return;
    }

    // Extract text content
    const responseText = message.text || '';
    
    if (responseText && onAIResponse) {
      console.log('[useApiChat] AI Response text:', responseText);
      onAIResponse(responseText);
      isWaitingForResponseRef.current = false;
    }
  }, [onAIResponse, onConsultationOffer]);

  /**
   * Poll for new messages
   */
  const pollForMessages = useCallback(async () => {
    if (!isPollingRef.current || !chatApiService.isInitialized()) {
      return;
    }

    // Only poll if we're waiting for a response
    if (!isWaitingForResponseRef.current) {
      return;
    }

    const result = await chatApiService.pollMessages();

    if (result.error) {
      console.error('[useApiChat] Polling error:', result.error);
      const socketError: SocketErrorPayload = {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
      };
      setError(socketError);
      onError?.(socketError);
      return;
    }

    if (result.data && result.data.length > 0) {
      result.data.forEach(processAIResponse);
    }
  }, [processAIResponse, onError]);

  /**
   * Start polling for messages
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return;
    }

    isPollingRef.current = true;
    const interval = getApiPollingInterval();
    
    console.log('[useApiChat] Starting polling with interval:', interval);
    
    pollingIntervalRef.current = setInterval(() => {
      pollForMessages();
    }, interval);
  }, [pollForMessages]);

  /**
   * Stop polling for messages
   */
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    console.log('[useApiChat] Stopped polling');
  }, []);

  /**
   * Connect (initialize the API service)
   */
  const connect = useCallback(async (): Promise<void> => {
    if (!sessionToken) {
      const tokenError: SocketErrorPayload = {
        code: 'NO_TOKEN',
        message: 'Session token is required',
      };
      setError(tokenError);
      throw tokenError;
    }

    setError(null);
    setConnectionState(SocketConnectionState.CONNECTING);

    try {
      chatApiService.initialize(sessionToken);
      setIsConnected(true);
      setConnectionState(SocketConnectionState.CONNECTED);
      startPolling();
      console.log('[useApiChat] Connected successfully');
    } catch (err) {
      const connectError: SocketErrorPayload = {
        code: 'CONNECTION_FAILED',
        message: err instanceof Error ? err.message : 'Failed to initialize chat service',
      };
      setError(connectError);
      setConnectionState(SocketConnectionState.ERROR);
      throw connectError;
    }
  }, [sessionToken, startPolling]);

  /**
   * Disconnect (cleanup)
   */
  const disconnect = useCallback((): void => {
    stopPolling();
    chatApiService.reset();
    setIsConnected(false);
    setConnectionState(SocketConnectionState.DISCONNECTED);
    console.log('[useApiChat] Disconnected');
  }, [stopPolling]);

  /**
   * Send a text message
   */
  const sendTextMessage = useCallback((message: string): boolean => {
    if (!chatApiService.isInitialized()) {
      console.warn('[useApiChat] Cannot send message - not initialized');
      return false;
    }

    console.log('[useApiChat] Sending text message:', message);
    
    // Set flag to start polling for response
    isWaitingForResponseRef.current = true;
    
    // Send message asynchronously
    chatApiService.sendMessage(message).then((result) => {
      if (result.error) {
        console.error('[useApiChat] Send message error:', result.error);
        const socketError: SocketErrorPayload = {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
        };
        setError(socketError);
        onError?.(socketError);
        isWaitingForResponseRef.current = false;
      } else {
        console.log('[useApiChat] Message sent successfully');
        // Immediately poll for response
        pollForMessages();
      }
    });

    return true;
  }, [onError, pollForMessages]);

  /**
   * Send message (legacy interface)
   */
  const sendMessage = useCallback((content: string, senderId: string): boolean => {
    return sendTextMessage(content);
  }, [sendTextMessage]);

  /**
   * Send typing indicator (no-op for API mode)
   */
  const sendTypingIndicator = useCallback((userId: string, isTyping: boolean): boolean => {
    // Typing indicators are not supported in API mode
    // This is a no-op to maintain interface compatibility
    return true;
  }, []);

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect && sessionToken && !isInitializedRef.current) {
      isInitializedRef.current = true;
      connect().catch((connectError) => {
        console.error('[useApiChat] Auto-connect failed:', connectError);
      });
    }

    return () => {
      stopPolling();
    };
  }, [autoConnect, sessionToken, connect, stopPolling]);

  return {
    isConnected,
    connectionState,
    connectionInfo: {
      state: connectionState,
      reconnectAttempts: 0,
    },
    connect,
    disconnect,
    sendMessage,
    sendTextMessage,
    sendTypingIndicator,
    error,
  };
};

export default useApiChat;

