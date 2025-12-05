/**
 * Socket Service
 * Manages WebSocket connection lifecycle and message handling
 */

import {
  SOCKET_CONFIG,
  buildSocketUrl,
  SocketConnectionState,
  SocketMessageType,
} from '../config/socketConfig';
import {
  SocketMessage,
  SocketConnectionInfo,
  SocketEventHandlers,
  SocketServiceOptions,
  SocketErrorPayload,
} from '../types/socketTypes';

class SocketService {
  private socket: WebSocket | null = null;
  private sessionToken: string = '';
  private connectionInfo: SocketConnectionInfo = {
    state: SocketConnectionState.DISCONNECTED,
    reconnectAttempts: 0,
  };
  private eventHandlers: SocketEventHandlers = {};
  private autoReconnect: boolean = true;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageListeners: Map<string, (message: SocketMessage) => void> = new Map();

  /**
   * Initialize the socket service with options
   */
  initialize(options: SocketServiceOptions): void {
    this.sessionToken = options.sessionToken;
    this.autoReconnect = options.autoReconnect ?? true;
    if (options.eventHandlers) {
      this.eventHandlers = options.eventHandlers;
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        console.log('[SocketService] Already connected');
        resolve();
        return;
      }

      if (!this.sessionToken) {
        const error: SocketErrorPayload = {
          code: 'NO_TOKEN',
          message: 'Session token is required for connection',
        };
        console.error('[SocketService] Connection failed - no session token');
        reject(error);
        return;
      }

      this.updateConnectionState(SocketConnectionState.CONNECTING);
      const url = buildSocketUrl(this.sessionToken);
      
      console.log('[SocketService] ========== WEBSOCKET CONNECTION ==========');
      console.log('[SocketService] Full URL:', url);
      console.log('[SocketService] Session Token (first 50 chars):', this.sessionToken.substring(0, 50) + '...');
      console.log('[SocketService] ==========================================');

      try {
        this.socket = new WebSocket(url);
        this.setupSocketEventListeners(resolve, reject);
        this.startConnectionTimeout(reject);
      } catch (error) {
        const socketError: SocketErrorPayload = {
          code: 'CONNECTION_FAILED',
          message: 'Failed to create WebSocket connection',
          details: error,
        };
        console.error('[SocketService] WebSocket creation failed:', error);
        this.updateConnectionState(SocketConnectionState.ERROR, socketError);
        reject(socketError);
      }
    });
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketEventListeners(
    resolve: () => void,
    reject: (error: SocketErrorPayload) => void
  ): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('[SocketService] ========== CONNECTION ESTABLISHED ==========');
      console.log('[SocketService] WebSocket connection successful!');
      console.log('[SocketService] Ready to send/receive messages');
      console.log('[SocketService] =============================================');
      this.clearConnectionTimeout();
      this.updateConnectionState(SocketConnectionState.CONNECTED);
      this.connectionInfo.reconnectAttempts = 0;
      this.connectionInfo.lastConnectedAt = Date.now();
      this.startPingInterval();
      this.eventHandlers.onConnect?.();
      resolve();
    };

    this.socket.onclose = (event) => {
      console.log('[SocketService] ========== CONNECTION CLOSED ==========');
      console.log('[SocketService] Code:', event.code);
      console.log('[SocketService] Reason:', event.reason || 'No reason provided');
      console.log('[SocketService] Was Clean:', event.wasClean);
      console.log('[SocketService] ========================================');
      this.clearPingInterval();
      this.connectionInfo.lastDisconnectedAt = Date.now();
      this.updateConnectionState(SocketConnectionState.DISCONNECTED);
      this.eventHandlers.onDisconnect?.(event.reason);
      
      if (this.autoReconnect && !event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (event) => {
      console.error('[SocketService] ========== WEBSOCKET ERROR ==========');
      console.error('[SocketService] Error event:', event);
      console.error('[SocketService] =====================================');
      const error: SocketErrorPayload = {
        code: 'SOCKET_ERROR',
        message: 'WebSocket encountered an error',
        details: event,
      };
      this.updateConnectionState(SocketConnectionState.ERROR, error);
      this.eventHandlers.onError?.(error);
    };

    this.socket.onmessage = (event) => {
      this.handleIncomingMessage(event.data);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(data: string): void {
    try {
      console.log('[SocketService] ========== MESSAGE RECEIVED ==========');
      console.log('[SocketService] Raw data:', JSON.stringify(data, null, 1));
      
      const rawMessage = JSON.parse(data);
      
      // Normalize the message format - handle both 'type' and 'message_type' fields
      const message: SocketMessage = {
        ...rawMessage,
        type: rawMessage.type || rawMessage.message_type,
        payload: rawMessage.payload || rawMessage,
      };
      
      console.log('[SocketService] Parsed message type:', message.type);
      console.log('[SocketService] Message content:', JSON.stringify(message, null, 2));
      console.log('[SocketService] =======================================');
      
      // Notify general message handler
      this.eventHandlers.onMessage?.(message);
      
      // Notify specific message type listeners
      this.messageListeners.forEach((listener) => {
        listener(message);
      });
    } catch (error) {
      console.error('[SocketService] Failed to parse message:', error);
      console.error('[SocketService] Raw data was:', data);
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: Record<string, unknown>): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[SocketService] Cannot send message - not connected');
      return false;
    }

    try {
      const messageString = JSON.stringify(message);
      console.log('[SocketService] ========== SENDING MESSAGE ==========');
      console.log('[SocketService] Message:', JSON.stringify(message, null, 1));
      console.log('[SocketService] ======================================');
      this.socket.send(messageString);
      return true;
    } catch (error) {
      console.error('[SocketService] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Send a text message to the AI
   * Format: { "message_code": 1011, "message_type": "text_message", "text": "user's message", "timestamp": "ISO string" }
   */
  sendTextMessage(message: string): boolean {
    const payload = {
      message_code: 1011,
      message_type: SocketMessageType.TEXT_MESSAGE,
      text: message,
      timestamp: new Date().toISOString(),
    };
    return this.send(payload);
  }

  /**
   * Send a chat message (legacy support)
   */
  sendChatMessage(content: string, senderId: string): boolean {
    // Use the new text_message format
    return this.sendTextMessage(content);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(userId: string, isTyping: boolean): boolean {
    return this.send({
      type: isTyping ? SocketMessageType.TYPING_START : SocketMessageType.TYPING_STOP,
      payload: { userId, isTyping },
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.autoReconnect = false;
    this.clearReconnectTimeout();
    this.clearPingInterval();
    this.clearConnectionTimeout();

    if (this.socket) {
      this.socket.close(1000, 'Client initiated disconnect');
      this.socket = null;
    }

    this.updateConnectionState(SocketConnectionState.DISCONNECTED);
    console.log('[SocketService] Disconnected');
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.connectionInfo.reconnectAttempts >= SOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log('[SocketService] Max reconnection attempts reached');
      const error: SocketErrorPayload = {
        code: 'MAX_RECONNECT_ATTEMPTS',
        message: 'Maximum reconnection attempts reached',
      };
      this.updateConnectionState(SocketConnectionState.ERROR, error);
      return;
    }

    this.connectionInfo.reconnectAttempts++;
    this.updateConnectionState(SocketConnectionState.RECONNECTING);
    this.eventHandlers.onReconnecting?.(this.connectionInfo.reconnectAttempts);

    console.log(
      `[SocketService] Reconnecting... Attempt ${this.connectionInfo.reconnectAttempts}/${SOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS}`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[SocketService] Reconnection failed:', error);
      });
    }, SOCKET_CONFIG.RECONNECT_INTERVAL);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Send a ping message to keep the connection alive
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, SOCKET_CONFIG.PING_INTERVAL);
  }

  /**
   * Start connection timeout
   */
  private startConnectionTimeout(reject: (error: SocketErrorPayload) => void): void {
    this.connectionTimeout = setTimeout(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        const error: SocketErrorPayload = {
          code: 'CONNECTION_TIMEOUT',
          message: 'Connection timed out',
        };
        this.socket?.close();
        this.updateConnectionState(SocketConnectionState.ERROR, error);
        reject(error);
      }
    }, SOCKET_CONFIG.CONNECTION_TIMEOUT);
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Clear ping interval
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Update connection state
   */
  private updateConnectionState(
    state: SocketConnectionState,
    error?: SocketErrorPayload
  ): void {
    this.connectionInfo.state = state;
    if (error) {
      this.connectionInfo.error = error;
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a message listener
   */
  addMessageListener(id: string, listener: (message: SocketMessage) => void): void {
    this.messageListeners.set(id, listener);
  }

  /**
   * Remove a message listener
   */
  removeMessageListener(id: string): void {
    this.messageListeners.delete(id);
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): SocketConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Update session token (for token refresh scenarios)
   */
  updateSessionToken(newToken: string): void {
    this.sessionToken = newToken;
    // If connected, reconnect with new token
    if (this.isConnected()) {
      this.disconnect();
      this.autoReconnect = true;
      this.connect().catch(console.error);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Also export the class for testing purposes
export { SocketService };

