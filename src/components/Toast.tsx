/**
 * Custom Toast Component
 * Cross-platform toast notification for iOS and Android
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const {width} = Dimensions.get('window');

export type ToastType = 'error' | 'success' | 'info' | 'warning';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastState extends ToastConfig {
  visible: boolean;
}

// Toast Manager - Singleton to manage toast state globally
class ToastManager {
  private static instance: ToastManager;
  private listener: ((config: ToastConfig | null) => void) | null = null;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setListener(listener: (config: ToastConfig | null) => void) {
    this.listener = listener;
  }

  show(config: ToastConfig) {
    if (this.listener) {
      this.listener(config);
    }
  }

  hide() {
    if (this.listener) {
      this.listener(null);
    }
  }
}

export const toastManager = ToastManager.getInstance();

// Helper function to show toast easily
export const showToast = (
  message: string,
  type: ToastType = 'error',
  duration: number = 3000,
) => {
  toastManager.show({message, type, duration});
};

// Toast icons based on type
const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'error':
      return '⚠️';
    case 'success':
      return '✅';
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚡';
    default:
      return '⚠️';
  }
};

// Toast colors based on type
const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'error':
      return {
        background: 'rgba(220, 53, 69, 0.95)',
        border: '#DC3545',
        text: '#FFFFFF',
      };
    case 'success':
      return {
        background: 'rgba(40, 167, 69, 0.95)',
        border: '#28A745',
        text: '#FFFFFF',
      };
    case 'info':
      return {
        background: 'rgba(23, 162, 184, 0.95)',
        border: '#17A2B8',
        text: '#FFFFFF',
      };
    case 'warning':
      return {
        background: 'rgba(255, 193, 7, 0.95)',
        border: '#FFC107',
        text: '#1A1A1A',
      };
    default:
      return {
        background: 'rgba(220, 53, 69, 0.95)',
        border: '#DC3545',
        text: '#FFFFFF',
      };
  }
};

/**
 * Toast Provider Component
 * Wrap your app with this component to enable toast notifications
 */
export const ToastProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'error',
    duration: 3000,
    visible: false,
  });

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(prev => ({...prev, visible: false}));
    });
  }, [translateY, opacity]);

  const showToastAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  useEffect(() => {
    toastManager.setListener((config) => {
      if (config) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setToast({
          message: config.message,
          type: config.type || 'error',
          duration: config.duration || 3000,
          visible: true,
        });

        showToastAnimation();

        // Auto hide after duration
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, config.duration || 3000);
      } else {
        hideToast();
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showToastAnimation, hideToast]);

  const colors = getToastColors(toast.type || 'error');
  const icon = getToastIcon(toast.type || 'error');

  return (
    <View style={styles.container}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              transform: [{translateY}],
              opacity,
            },
          ]}
        >
          <Text style={styles.toastIcon}>{icon}</Text>
          <Text style={[styles.toastMessage, {color: colors.text}]} numberOfLines={3}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    maxWidth: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default ToastProvider;

