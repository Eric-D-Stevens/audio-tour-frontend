import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts';

const AuthScreen = ({ route, navigation }) => {
  // Check if we're coming back from email verification
  const verifiedEmail = route.params?.verifiedEmail || '';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(verifiedEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  
  // If we have a verified email, show a success message
  useEffect(() => {
    if (verifiedEmail) {
      setErrorMessage('Account verified! You can now log in.');
    }
  }, [verifiedEmail]);
  
  // Load previous remember me preference on component mount
  useEffect(() => {
    const loadRememberMePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('tensortours_remember_me');
        if (savedPreference !== null) {
          setRememberMe(JSON.parse(savedPreference));
        }
      } catch (error) {
        console.error('Error loading remember me preference:', error);
      }
    };
    
    loadRememberMePreference();
  }, []);

  const auth = useContext(AuthContext);

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (!isLogin && !privacyPolicyAgreed) {
      setErrorMessage('You must agree to the Privacy Policy to create an account');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isLogin) {
        // Sign in with the remember me preference
        await auth.signIn(email, password, rememberMe);
      } else {
        // Sign up with privacy policy consent data
        const policyVersion = '1.0'; // Version of the privacy policy
        const consentTimestamp = new Date().toISOString();
        await auth.signUp(email, password, email, policyVersion, consentTimestamp);
        
        // Navigate to email verification screen
        navigation.navigate('EmailVerification', { email });
        return;
      }
    } catch (error) {
      console.log('Auth error:', error);
      
      // Special handling for unverified accounts
      if (error.unverifiedAccount) {
        // Redirect to email verification screen
        setIsLoading(false);
        navigation.navigate('EmailVerification', { 
          email: email,
          unverifiedLogin: true,
          message: 'Your account needs verification to continue. Please check your email for a verification code or request a new one below.'
        });
        return;
      }
      
      setErrorMessage(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    navigation.navigate('GuestMap');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>TensorTours</Text>
            </View>
            <Text style={styles.tagline}>Discover the world through AI-powered audio</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{isLogin ? 'Sign In' : 'Create Account'}</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <View style={styles.privacyPolicyContainer}>
                  <Switch
                    value={privacyPolicyAgreed}
                    onValueChange={setPrivacyPolicyAgreed}
                    trackColor={{ false: '#d1d1d1', true: '#FF8a65' }}
                    thumbColor={privacyPolicyAgreed ? '#FF5722' : '#f4f3f4'}
                  />
                  <View style={styles.privacyTextContainer}>
                    <Text style={styles.privacyText}>I agree to the </Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                      <Text style={styles.privacyLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {isLogin && (
              <View style={styles.rememberMeContainer}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: '#d1d1d1', true: '#FF8a65' }}
                  thumbColor={rememberMe ? '#FF5722' : '#f4f3f4'}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setErrorMessage('');
              }}
            >
              <Text style={styles.switchModeText}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.guestButton} onPress={handleGuestAccess}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
              <Text style={styles.guestButtonSubtext}>Explore preset cities without an account</Text>
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
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 10, // Square with slightly rounded corners
    backgroundColor: '#FF5722', // Orange color for TensorTours branding
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
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
  guestButtonSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rememberMeText: {
    marginLeft: 10,
    color: '#666',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF5722', // Orange color for TensorTours branding
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#FF5722', // Orange color for TensorTours branding
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  privacyPolicyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  privacyTextContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  privacyText: {
    color: '#666',
    fontSize: 14,
  },
  privacyLink: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  guestButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF5722', // Orange color for TensorTours branding
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  guestButtonText: {
    color: '#FF5722', // Orange color for TensorTours branding
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButtonSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
});

export default AuthScreen;
