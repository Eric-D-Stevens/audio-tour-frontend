import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts';
import logger from '../utils/logger';

const EmailVerificationScreen = ({ route, navigation }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email, unverifiedLogin = false, message = null } = route.params;
  const auth = useContext(AuthContext);

  const handleVerification = async () => {
    if (!verificationCode) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Use email as username since we're using email-based authentication
      await auth.confirmSignUp(email.toLowerCase(), verificationCode);
      setErrorMessage('Email verified successfully!');
      
      // Short pause to show success message
      setTimeout(() => {
        // If this was from an unverified login attempt, go back to Auth with email prefilled
        if (unverifiedLogin) {
          navigation.replace('Auth', { verifiedEmail: email });
        } else {
          navigation.replace('Auth');
        }
      }, 1500); // Show success message briefly before redirecting
    } catch (error) {
      logger.error('Verification error:', error);
      setErrorMessage(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // Use email as username since we're using email-based authentication
      await auth.resendConfirmationCode(email.toLowerCase());
      setErrorMessage('A new verification code has been sent to your email');
    } catch (error) {
      logger.error('Resend code error:', error);
      setErrorMessage(error.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              {message || `Please enter the verification code sent to ${email}`}
            </Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerification}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendCode}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  errorIcon: {
    color: '#FF5722',
    marginRight: 10,
  },
  errorText: {
    color: '#FF5722',
    flex: 1,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: '#FF5722',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;
