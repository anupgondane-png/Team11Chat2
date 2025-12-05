/**
 * useSocket Hook
 * Custom React hook for managing WebSocket connection in components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { SocketConnectionState, SocketMessageType } from '../config/socketConfig';
import {
  SocketMessage,
  SocketConnectionInfo,
  SocketErrorPayload,
  IncomingChatMessage,
  AIResponsePayload,
} from '../types/socketTypes';

interface UseSocketOptions {
  sessionToken: string;
  autoConnect?: boolean;
  onMessage?: (message: IncomingChatMessage) => void;
  onAIResponse?: (response: string) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onError?: (error: SocketErrorPayload) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  connectionState: SocketConnectionState;
  connectionInfo: SocketConnectionInfo;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string, senderId: string) => boolean;
  sendTextMessage: (message: string) => boolean;
  sendTypingIndicator: (userId: string, isTyping: boolean) => boolean;
  error: SocketErrorPayload | null;
}

/**
 * Custom hook for WebSocket connection management
 */
export const useSocket = (options: UseSocketOptions): UseSocketReturn => {
  const {
    sessionToken,
    autoConnect = true,
    onMessage,
    onAIResponse,
    onTyping,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    SocketConnectionState.DISCONNECTED
  );
  const [connectionInfo, setConnectionInfo] = useState<SocketConnectionInfo>({
    state: SocketConnectionState.DISCONNECTED,
    reconnectAttempts: 0,
  });
  const [error, setError] = useState<SocketErrorPayload | null>(null);

  const listenerIdRef = useRef<string>(`listener_${Date.now()}`);
  const isInitializedRef = useRef(false);

  /**
   * Handle incoming socket messages
   */
  const handleMessage = useCallback(
    (message: SocketMessage) => {
      console.log('[useSocket] Processing message type:', message.type);
      
      // Handle AI response - the main response type from server
      if (message.type === SocketMessageType.AI_RESPONSE || message.type === 'ai_response') {
        console.log('[useSocket] AI Response received');
        // Extract message content from various possible formats
        const payload = message.payload as AIResponsePayload | undefined;
        const responseContent = 
          message.text ||  // Server sends response in 'text' field
          message.message || 
          message.content || 
          payload?.text ||
          payload?.message || 
          payload?.content || 
          payload?.response ||
          '';
        
        console.log('[useSocket] Extracted AI response content:', responseContent);
        
        if (responseContent && onAIResponse) {
          onAIResponse(responseContent);
        }
        return;
      }

      switch (message.type) {
        case SocketMessageType.MESSAGE_RECEIVED:
        case SocketMessageType.CHAT_MESSAGE:
          if (onMessage && message.payload) {
            const chatMessage = message.payload as IncomingChatMessage;
            onMessage({
              id: message.messageId || chatMessage.id || Date.now().toString(),
              content: chatMessage.content,
              senderId: chatMessage.senderId,
              senderName: chatMessage.senderName,
              timestamp: message.timestamp || Date.now(),
              messageType: chatMessage.messageType || 'text',
            });
          }
          break;

        case SocketMessageType.USER_TYPING:
        case SocketMessageType.TYPING_START:
        case SocketMessageType.TYPING_STOP:
          if (onTyping && message.payload) {
            const typingPayload = message.payload as { userId: string; isTyping: boolean };
            onTyping(typingPayload.userId, typingPayload.isTyping);
          }
          break;

        case SocketMessageType.ERROR:
        case 'error':
          if (message.payload) {
            const errorPayload = message.payload as SocketErrorPayload;
            setError(errorPayload);
            onError?.(errorPayload);
          }
          break;

        default:
          console.log('[useSocket] Unhandled message type:', message.type);
          // Try to extract any message content for unknown types
          const unknownPayload = message.payload as AIResponsePayload | undefined;
          const content = message.message || message.content || unknownPayload?.message || unknownPayload?.content;
          if (content && onMessage) {
            onMessage({
              id: message.messageId || Date.now().toString(),
              content: content,
              senderId: 'server',
              timestamp: message.timestamp || Date.now(),
              messageType: 'text',
            });
          }
      }
    },
    [onMessage, onAIResponse, onTyping, onError]
  );

  /**
   * Connect to the WebSocket server
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

    socketService.initialize({
      sessionToken,
      autoReconnect: true,
      eventHandlers: {
        onConnect: () => {
          setIsConnected(true);
          setConnectionState(SocketConnectionState.CONNECTED);
          setConnectionInfo(socketService.getConnectionInfo());
        },
        onDisconnect: () => {
          setIsConnected(false);
          setConnectionState(SocketConnectionState.DISCONNECTED);
          setConnectionInfo(socketService.getConnectionInfo());
        },
        onError: (socketError) => {
          setError(socketError);
          setConnectionState(SocketConnectionState.ERROR);
          setConnectionInfo(socketService.getConnectionInfo());
          onError?.(socketError);
        },
        onReconnecting: (attempt) => {
          setConnectionState(SocketConnectionState.RECONNECTING);
          setConnectionInfo({
            ...socketService.getConnectionInfo(),
            reconnectAttempts: attempt,
          });
        },
      },
    });

    // Add message listener
    socketService.addMessageListener(listenerIdRef.current, handleMessage);

    try {
      await socketService.connect();
    } catch (connectError) {
      const socketError = connectError as SocketErrorPayload;
      setError(socketError);
      setConnectionState(SocketConnectionState.ERROR);
      throw socketError;
    }
  }, [sessionToken, handleMessage, onError]);

  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback((): void => {
    socketService.removeMessageListener(listenerIdRef.current);
    socketService.disconnect();
    setIsConnected(false);
    setConnectionState(SocketConnectionState.DISCONNECTED);
  }, []);

  /**
   * Send a text message to the AI
   * Uses the text_message format: { "type": "text_message", "message": "..." }
   */
  const sendTextMessage = useCallback((message: string): boolean => {
    console.log('[useSocket] Sending text message:', message);
    return socketService.sendTextMessage(message);
  }, []);

  /**
   * Send a chat message (legacy, now uses sendTextMessage internally)
   */
  const sendMessage = useCallback((content: string, senderId: string): boolean => {
    return sendTextMessage(content);
  }, [sendTextMessage]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(
    (userId: string, isTyping: boolean): boolean => {
      return socketService.sendTypingIndicator(userId, isTyping);
    },
    []
  );

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect && sessionToken && !isInitializedRef.current) {
      isInitializedRef.current = true;
      connect().catch((connectError) => {
        console.error('[useSocket] Auto-connect failed:', connectError);
      });
    }

    return () => {
      // Cleanup on unmount
      socketService.removeMessageListener(listenerIdRef.current);
    };
  }, [autoConnect, sessionToken, connect]);

  /**
   * Update message listener when handlers change
   */
  useEffect(() => {
    if (isConnected) {
      socketService.removeMessageListener(listenerIdRef.current);
      socketService.addMessageListener(listenerIdRef.current, handleMessage);
    }
  }, [handleMessage, isConnected]);

  return {
    isConnected,
    connectionState,
    connectionInfo,
    connect,
    disconnect,
    sendMessage,
    sendTextMessage,
    sendTypingIndicator,
    error,
  };
};

export default useSocket;

