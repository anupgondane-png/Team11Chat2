import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import {
  useSocket,
  SocketConnectionState,
  IncomingChatMessage,
  SocketErrorPayload,
} from '../features/socket';
import { useSession } from '../features/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
};

// Screen states
type ScreenState = 'loading_session' | 'session_error' | 'ready';

const ChatScreen: React.FC<Props> = ({route}) => {
  const {healthId, mobileNumber, userId} = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading_session');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Session management
  const {
    isLoading: isSessionLoading,
    session,
    error: sessionError,
    hasExistingSession,
    getOrCreateSession,
    clearError: clearSessionError,
  } = useSession();

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      console.log('[ChatScreen] Initializing session for user:', userId);
      setScreenState('loading_session');
      
      const sessionData = await getOrCreateSession({
        userId: userId,
        userJhhId: healthId, // Using healthId as JHH ID
      });

      if (sessionData && sessionData.session_token) {
        console.log('[ChatScreen] Session obtained:', sessionData.session_id);
        console.log('[ChatScreen] Is existing session:', hasExistingSession);
        setSessionToken(sessionData.session_token);
        setScreenState('ready');
      } else {
        console.error('[ChatScreen] Failed to get session');
        setScreenState('session_error');
      }
    };

    initializeSession();
  }, [userId, healthId, getOrCreateSession, hasExistingSession]);

  // Handle incoming messages from socket (legacy format)
  const handleIncomingMessage = useCallback((incomingMessage: IncomingChatMessage) => {
    console.log('[ChatScreen] Incoming message:', incomingMessage);
    const newMessage: Message = {
      id: incomingMessage.id,
      text: incomingMessage.content,
      sender: incomingMessage.senderId === userId ? 'user' : 'other',
      timestamp: new Date(incomingMessage.timestamp),
    };
    setMessages(prev => [...prev, newMessage]);
  }, [userId]);

  // Handle AI response from socket
  const handleAIResponse = useCallback((response: string) => {
    console.log('[ChatScreen] AI Response received:', response);
    const aiMessage: Message = {
      id: `ai_${Date.now()}`,
      text: response,
      sender: 'other',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
  }, []);

  // Handle typing indicator
  const handleTyping = useCallback((typingUserId: string, typing: boolean) => {
    if (typingUserId !== userId) {
      setTypingUser(typing ? typingUserId : null);
    }
  }, [userId]);

  // Handle socket errors
  const handleSocketError = useCallback((error: SocketErrorPayload) => {
    console.error('[ChatScreen] Socket error:', error);
    const errorMessage: Message = {
      id: Date.now().toString(),
      text: `Connection error: ${error.message}`,
      sender: 'other',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMessage]);
  }, []);

  // Initialize socket connection with session token
  const {
    isConnected,
    connectionState,
    connect,
    disconnect,
    sendTextMessage,
    sendTypingIndicator,
    error: socketError,
  } = useSocket({
    sessionToken: sessionToken || '',
    autoConnect: !!sessionToken, // Only auto-connect when we have a session token
    onMessage: handleIncomingMessage,
    onAIResponse: handleAIResponse,
    onTyping: handleTyping,
    onError: handleSocketError,
  });

  // Add welcome message when connected
  useEffect(() => {
    if (isConnected && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: 'Hello! I\'m your cardiac health assistant. How are you feeling today? Are you experiencing any chest discomfort, shortness of breath, or heart-related concerns I can help you with?',
          sender: 'other',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isConnected, messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Retry session initialization
  const retrySession = useCallback(async () => {
    clearSessionError();
    setScreenState('loading_session');
    
    const sessionData = await getOrCreateSession({
      userId: userId,
      userJhhId: healthId,
    });

    if (sessionData && sessionData.session_token) {
      setSessionToken(sessionData.session_token);
      setScreenState('ready');
    } else {
      setScreenState('session_error');
    }
  }, [userId, healthId, getOrCreateSession, clearSessionError]);

  // Handle text input change with typing indicator
  const handleTextChange = (text: string) => {
    setMessage(text);

    // Send typing indicator
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(userId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(userId, false);
    }, 2000);
  };

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    const messageText = message.trim();

    // Clear typing indicator
    setIsTyping(false);
    sendTypingIndicator(userId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Add message to local state immediately for optimistic UI
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Send text_message through socket
    // Format: { "type": "text_message", "message": "user's message" }
    console.log('[ChatScreen] Sending text_message:', messageText);
    const sent = sendTextMessage(messageText);
    if (!sent) {
      console.warn('[ChatScreen] Failed to send message through socket');
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.otherBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.otherTimestamp,
            ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // Get connection status text and color
  const getConnectionStatus = () => {
    switch (connectionState) {
      case SocketConnectionState.CONNECTED:
        return { text: 'Online', color: '#00FF88' };
      case SocketConnectionState.CONNECTING:
        return { text: 'Connecting...', color: '#FFB800' };
      case SocketConnectionState.RECONNECTING:
        return { text: 'Reconnecting...', color: '#FFB800' };
      case SocketConnectionState.ERROR:
        return { text: 'Connection Error', color: '#FF4444' };
      default:
        return { text: 'Offline', color: '#8B9DC3' };
    }
  };

  const connectionStatus = getConnectionStatus();

  // Loading session state
  if (screenState === 'loading_session') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Initializing session...</Text>
        <Text style={styles.loadingSubtext}>Please wait while we set up your chat</Text>
      </View>
    );
  }

  // Session error state
  if (screenState === 'session_error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Session Error</Text>
        <Text style={styles.errorMessage}>
          {sessionError?.message || 'Failed to initialize session'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retrySession}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {mobileNumber.slice(-2)}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>+91 {mobileNumber}</Text>
            <View style={styles.statusContainer}>
              {(connectionState === SocketConnectionState.CONNECTING ||
                connectionState === SocketConnectionState.RECONNECTING) && (
                <ActivityIndicator size="small" color={connectionStatus.color} style={styles.statusIndicator} />
              )}
              <View style={[styles.statusDot, { backgroundColor: connectionStatus.color }]} />
              <Text style={[styles.headerSubtitle, { color: connectionStatus.color }]}>
                {connectionStatus.text}
              </Text>
            </View>
          </View>
        </View>
        {socketError && (
          <TouchableOpacity style={styles.reconnectButton} onPress={() => connect()}>
            <Text style={styles.reconnectButtonText}>Tap to Reconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {typingUser && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Someone is typing...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8B9DC3"
            value={message}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            editable={isConnected}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim() && isConnected && styles.sendButtonActive,
            !isConnected && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          activeOpacity={0.7}
          disabled={!isConnected}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    color: '#8B9DC3',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FF4444',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#8B9DC3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#00D9FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#0A1628',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1628',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#00FF88',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusIndicator: {
    marginRight: 6,
  },
  reconnectButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  reconnectButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  typingText: {
    color: '#8B9DC3',
    fontSize: 13,
    fontStyle: 'italic',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#00D9FF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#0A1628',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(10, 22, 40, 0.6)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#8B9DC3',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 217, 255, 0.2)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    marginRight: 12,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#00D9FF',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(139, 157, 195, 0.3)',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default ChatScreen;

