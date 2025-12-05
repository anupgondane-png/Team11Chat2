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
  ScrollView,
  Switch,
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

// Heart Icon Component
const HeartIcon = () => (
  <View style={styles.heartContainer}>
    <Text style={styles.heartIcon}>❤️</Text>
    <View style={styles.heartPulse}>
      <View style={styles.ecgLine}>
        <Text style={styles.ecgText}>~∿∿~</Text>
      </View>
    </View>
  </View>
);

// Stethoscope decoration
const StethoscopeDecor = () => (
  <View style={styles.stethoscopeDecor}>
    <Text style={styles.stethoscopeEmoji}>🩺</Text>
  </View>
);

// Default credentials
const DEFAULT_CREDENTIALS = {
  healthId: 'MQNE-5493',
  mobileNumber: '7021066279',
  userId: '176130',
};

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [useDefaultCredentials, setUseDefaultCredentials] = useState(true);
  const [healthId, setHealthId] = useState(DEFAULT_CREDENTIALS.healthId);
  const [mobileNumber, setMobileNumber] = useState(DEFAULT_CREDENTIALS.mobileNumber);
  const [userId, setUserId] = useState(DEFAULT_CREDENTIALS.userId);

  const handleToggleDefault = (value: boolean) => {
    setUseDefaultCredentials(value);
    if (value) {
      // Prefill with default credentials
      setHealthId(DEFAULT_CREDENTIALS.healthId);
      setMobileNumber(DEFAULT_CREDENTIALS.mobileNumber);
      setUserId(DEFAULT_CREDENTIALS.userId);
    } else {
      // Clear fields for manual entry
      setHealthId('');
      setMobileNumber('');
      setUserId('');
    }
  };

  const validateMobileNumber = (number: string): boolean => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const handleContinue = () => {
    if (!healthId.trim()) {
      Alert.alert('Error', 'Please enter your Health ID');
      return;
    }

    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter your User ID');
      return;
    }

    navigation.navigate('Chat', {healthId, mobileNumber, userId});
  };

  const handleMobileChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setMobileNumber(numericText);
    }
  };

  const isFormValid = healthId.trim() && mobileNumber.length === 10 && userId.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.patternCircle3} />
        </View>

        <View style={styles.content}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <HeartIcon />
            <Text style={styles.logo}>HridAI</Text>
            <Text style={styles.tagline}>Your Cardiac Health Companion</Text>
            <View style={styles.subtitleContainer}>
              <StethoscopeDecor />
              <Text style={styles.subtitle}>
                AI-Powered Cardiology Assistant
              </Text>
            </View>
          </View>

          {/* Medical Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🏥</Text>
            <Text style={styles.infoText}>
              Connect with our AI cardiologist for personalized heart health guidance
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Patient Login</Text>
              <View style={styles.formDivider} />
            </View>

            {/* Default Credentials Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.toggleIcon}>🔑</Text>
                <Text style={styles.toggleLabel}>Use Default Credentials</Text>
              </View>
              <Switch
                value={useDefaultCredentials}
                onValueChange={handleToggleDefault}
                trackColor={{false: 'rgba(160, 180, 200, 0.3)', true: 'rgba(220, 53, 69, 0.5)'}}
                thumbColor={useDefaultCredentials ? '#DC3545' : '#A0B4C8'}
                ios_backgroundColor="rgba(160, 180, 200, 0.3)"
              />
            </View>

            {/* Health ID Input */}
            <Text style={styles.label}>
              <Text style={styles.labelIcon}>🆔 </Text>
              Health ID
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputFull}
                placeholder="Enter your Health ID (e.g., ABHA ID)"
                placeholderTextColor="#7A8FA6"
                value={healthId}
                onChangeText={setHealthId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Mobile Number Input */}
            <Text style={styles.label}>
              <Text style={styles.labelIcon}>📱 </Text>
              Mobile Number
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#7A8FA6"
                value={mobileNumber}
                onChangeText={handleMobileChange}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* User ID Input */}
            <Text style={styles.label}>
              <Text style={styles.labelIcon}>👤 </Text>
              Patient ID
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputFull}
                placeholder="Enter your Patient ID"
                placeholderTextColor="#7A8FA6"
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.button, isFormValid ? styles.buttonActive : null]}
              onPress={handleContinue}
              activeOpacity={0.8}>
              <Text style={styles.buttonIcon}>💬</Text>
              <Text
                style={[
                  styles.buttonText,
                  isFormValid ? styles.buttonTextActive : null,
                ]}>
                Start Consultation
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustText}>HIPAA Compliant</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🛡️</Text>
              <Text style={styles.trustText}>End-to-End Encrypted</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
            <Text style={styles.disclaimerText}>
              ⚠️ For emergencies, please call 112 or visit the nearest hospital
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(220, 53, 69, 0.08)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(220, 53, 69, 0.05)',
  },
  patternCircle3: {
    position: 'absolute',
    top: '40%',
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(23, 162, 184, 0.06)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heartContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heartIcon: {
    fontSize: 56,
  },
  heartPulse: {
    marginTop: -8,
  },
  ecgLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecgText: {
    fontSize: 24,
    color: '#DC3545',
    fontWeight: '300',
    letterSpacing: 2,
  },
  logo: {
    fontSize: 52,
    fontWeight: '800',
    color: '#DC3545',
    letterSpacing: 3,
    textShadowColor: 'rgba(220, 53, 69, 0.4)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 15,
    color: '#E8E8E8',
    marginTop: 6,
    letterSpacing: 1,
    fontWeight: '500',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stethoscopeDecor: {
    marginRight: 8,
  },
  stethoscopeEmoji: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#17A2B8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 162, 184, 0.15)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(23, 162, 184, 0.3)',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#B8D4E3',
    lineHeight: 18,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
    shadowColor: '#DC3545',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  formDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#DC3545',
    borderRadius: 2,
    marginTop: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#E8E8E8',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    color: '#A0B4C8',
    marginBottom: 10,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  labelIcon: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 27, 42, 0.8)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(160, 180, 200, 0.2)',
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 17,
    color: '#17A2B8',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(160, 180, 200, 0.2)',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputFull: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: 'rgba(220, 53, 69, 0.25)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 53, 69, 0.4)',
    marginTop: 8,
  },
  buttonActive: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
    shadowColor: '#DC3545',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  trustContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    gap: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#6C8EAD',
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#5A7089',
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#DC3545',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default LoginScreen;
