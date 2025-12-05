/**
 * Chat API Service
 * Handles chat API calls for sending messages and polling responses
 * Used when socket mode is disabled (enableSocketFlag = false)
 */

import { sendMessageUrl, getMessagesUrl } from '../config/chatApiConfig';
import { isMockApiEnabled } from '../../../config/appConfig';
import {
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  AIMessageResponse,
  ChatApiError,
} from '../types/chatTypes';

// Mock responses for testing when API is not deployed
const MOCK_RESPONSES: string[] = [
  "I understand you're experiencing chest pain. This is a symptom that should be taken seriously. Can you describe the pain? Is it sharp, dull, or pressure-like? Does it radiate to your arm, jaw, or back?",
  "Based on what you've described, I'd recommend monitoring your symptoms closely. If the pain persists or worsens, please seek immediate medical attention. In the meantime, try to rest and avoid strenuous activities.",
  "Heart health is very important. Some general recommendations include: maintaining a healthy diet low in saturated fats, regular moderate exercise, managing stress, and getting adequate sleep. Would you like more specific guidance?",
  "I'm here to help you understand your symptoms better. Remember, while I can provide guidance, I'm an AI assistant and my advice should not replace professional medical consultation. For any emergency symptoms, please call 112 immediately.",
  "Thank you for sharing that information. To better assist you, could you tell me about any medications you're currently taking, or if you have any known heart conditions or risk factors?",
];

class ChatApiService {
  private sessionToken: string = '';
  private lastMessageId: string | undefined;
  private pendingMockResponse: string | null = null;
  private mockResponseIndex: number = 0;

  /**
   * Initialize the chat API service with session token
   */
  initialize(sessionToken: string): void {
    this.sessionToken = sessionToken;
    this.lastMessageId = undefined;
    this.pendingMockResponse = null;
    console.log('[ChatApiService] Initialized with session token');
  }

  /**
   * Generate a mock AI response
   */
  private generateMockResponse(_userMessage: string): string {
    // Cycle through mock responses
    const response = MOCK_RESPONSES[this.mockResponseIndex % MOCK_RESPONSES.length];
    this.mockResponseIndex++;
    return response;
  }

  /**
   * Send a text message to the AI via API
   * @param message - The message text to send
   * @returns Send message response
   */
  async sendMessage(message: string): Promise<{ data: SendMessageResponse | null; error: ChatApiError | null }> {
    // Check if mock mode is enabled
    if (isMockApiEnabled()) {
      console.log('[ChatApiService] Mock mode enabled - simulating send message');
      console.log('[ChatApiService] User message:', message);
      
      // Store a mock response to be returned on next poll
      this.pendingMockResponse = this.generateMockResponse(message);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        data: {
          success: true,
          message_id: `mock_${Date.now()}`,
        },
        error: null,
      };
    }

    try {
      const url = sendMessageUrl();
      const request: SendMessageRequest = {
        session_token: this.sessionToken,
        message_code: 1011,
        message_type: 'text_message',
        text: message,
        timestamp: new Date().toISOString(),
      };

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Log Request
      console.log('[ChatApiService] ========== SEND MESSAGE REQUEST ==========');
      console.log('[ChatApiService] Method: POST');
      console.log('[ChatApiService] URL:', url);
      console.log('[ChatApiService] Headers:', JSON.stringify(headers, null, 2));
      console.log('[ChatApiService] Request Body:', JSON.stringify(request, null, 2));
      console.log('[ChatApiService] ==========================================');

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      const responseData = await response.json();

      // Log Response
      console.log('[ChatApiService] ========== SEND MESSAGE RESPONSE ==========');
      console.log('[ChatApiService] Status:', response.status, response.statusText);
      console.log('[ChatApiService] Response Body:', JSON.stringify(responseData, null, 2));
      console.log('[ChatApiService] ============================================');

      if (!response.ok) {
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: responseData.error || responseData.message || 'Failed to send message',
          },
        };
      }

      return {
        data: {
          success: true,
          message_id: responseData.message_id,
        },
        error: null,
      };
    } catch (error) {
      console.error('[ChatApiService] Send message error:', error);
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Poll for new messages from the AI
   * @returns New messages if available
   */
  async pollMessages(): Promise<{ data: AIMessageResponse[] | null; error: ChatApiError | null }> {
    // Check if mock mode is enabled
    if (isMockApiEnabled()) {
      // If we have a pending mock response, return it
      if (this.pendingMockResponse) {
        console.log('[ChatApiService] Mock mode - returning mock response');
        
        // Simulate network delay for more realistic behavior
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const mockMessage: AIMessageResponse = {
          message_code: 1012,
          message_type: 'ai_response',
          text: this.pendingMockResponse,
          timestamp: new Date().toISOString(),
          message_id: `mock_response_${Date.now()}`,
        };
        
        // Clear the pending response
        this.pendingMockResponse = null;
        
        return { data: [mockMessage], error: null };
      }
      
      // No pending response
      return { data: [], error: null };
    }

    try {
      const url = getMessagesUrl(this.sessionToken, this.lastMessageId);
      const headers = {
        'Accept': 'application/json',
      };

      // Log Request
      console.log('[ChatApiService] ========== POLL MESSAGES REQUEST ==========');
      console.log('[ChatApiService] Method: GET');
      console.log('[ChatApiService] URL:', url);
      console.log('[ChatApiService] Last Message ID:', this.lastMessageId || 'none');
      console.log('[ChatApiService] ==========================================');

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      // Log Response
      console.log('[ChatApiService] ========== POLL MESSAGES RESPONSE ==========');
      console.log('[ChatApiService] Status:', response.status, response.statusText);
      console.log('[ChatApiService] Response Body:', JSON.stringify(responseData, null, 2));
      console.log('[ChatApiService] ============================================');

      if (!response.ok) {
        // 404 means no new messages, which is not an error
        if (response.status === 404) {
          return { data: [], error: null };
        }

        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: responseData.error || responseData.message || 'Failed to poll messages',
          },
        };
      }

      // Handle response format
      let messages: AIMessageResponse[] = [];
      
      if (responseData.success && responseData.messages) {
        messages = responseData.messages;
      } else if (Array.isArray(responseData)) {
        messages = responseData;
      } else if (responseData.text || responseData.message_type) {
        // Single message response
        messages = [responseData];
      }

      // Update last message ID for pagination
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.message_id) {
          this.lastMessageId = lastMessage.message_id;
        }
      }

      return { data: messages, error: null };
    } catch (error) {
      console.error('[ChatApiService] Poll messages error:', error);
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this.sessionToken = '';
    this.lastMessageId = undefined;
    this.pendingMockResponse = null;
    console.log('[ChatApiService] Reset');
  }

  /**
   * Get current session token
   */
  getSessionToken(): string {
    return this.sessionToken;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return !!this.sessionToken;
  }
}

// Export singleton instance
export const chatApiService = new ChatApiService();

// Also export the class for testing purposes
export { ChatApiService };
