import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [mobileNumber, setMobileNumber] = useState('');

  const validateMobileNumber = (number: string): boolean => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const handleContinue = () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    navigation.navigate('Chat', {mobileNumber});
  };

  const handleMobileChange = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setMobileNumber(numericText);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>Team11</Text>
          <Text style={styles.subtitle}>Connect & Chat</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#8B9DC3"
              value={mobileNumber}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              mobileNumber.length === 10 && styles.buttonActive,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue to Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#00D9FF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 217, 255, 0.4)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B9DC3',
    marginTop: 8,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  label: {
    fontSize: 14,
    color: '#8B9DC3',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
    marginBottom: 24,
  },
  countryCode: {
    fontSize: 18,
    color: '#00D9FF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 217, 255, 0.3)',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: 'rgba(0, 217, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.5)',
  },
  buttonActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#5A6B8C',
    textAlign: 'center',
  },
});

export default LoginScreen;

