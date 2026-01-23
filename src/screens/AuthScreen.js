import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Switch, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext, useTheme } from '../contexts';
import logger from '../utils/logger';

// Get color based on strength percentage
const getStrengthColor = (percentage) => {
  if (percentage < 25) return '#E0E0E0'; // Light gray
  if (percentage < 50) return '#FFCBB3'; // Lightest orange
  if (percentage < 75) return '#FFA579'; // Light orange
  if (percentage < 100) return '#FF8F59'; // Medium orange
  return '#FF5722'; // TensorWorks orange
};

const AuthScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  
  // Check if we're coming back from email verification
  const verifiedEmail = route.params?.verifiedEmail || '';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(verifiedEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation states
  const [lengthValid, setLengthValid] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // If we have a verified email, show a success message
  useEffect(() => {
    if (verifiedEmail) {
      setErrorMessage('Account verified! You can now log in.');
    }
  }, [verifiedEmail]);
  


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
        // Sign in user
        await auth.signIn(email, password);
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
      logger.error('Auth error:', error);
      
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

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    tagline: { fontSize: 16, color: colors.textSecondary },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    formTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: colors.text },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryFaded,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    input: { backgroundColor: colors.inputBackground, borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16, color: colors.text },
    passwordRequirementsContainer: { backgroundColor: colors.primaryFadedMore, borderRadius: 8, padding: 12, marginBottom: 15 },
    passwordRequirementsTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 10 },
    requirementText: { color: colors.textSecondary, fontSize: 13 },
    passwordInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 8, marginBottom: 15 },
    passwordInput: { flex: 1, backgroundColor: colors.inputBackground, borderRadius: 8, padding: 15, fontSize: 16, color: colors.text },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { marginHorizontal: 10, color: colors.textSecondary },
    privacyText: { color: colors.textSecondary, fontSize: 14 },
    guestButton: {
      backgroundColor: colors.guestButtonBackground,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      marginTop: 5,
    },
    guestButtonSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>TensorTours</Text>
            </View>
            <Text style={dynamicStyles.tagline}>Discover the world through AI-powered audio</Text>
          </View>

          <View style={dynamicStyles.formContainer}>
            <Text style={dynamicStyles.formTitle}>{isLogin ? 'Sign In' : 'Create Account'}</Text>

            {errorMessage ? (
              <View style={dynamicStyles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={{ color: colors.primary, flex: 1, fontSize: 14 }}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={dynamicStyles.input}
              placeholder="Email"
              placeholderTextColor={colors.textPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType={isLogin ? "username" : "none"}
              autoComplete={isLogin ? "email" : "off"}
            />
            
            {!isLogin && (
              <View style={dynamicStyles.passwordRequirementsContainer}>
                <Text style={dynamicStyles.passwordRequirementsTitle}>Password requirements:</Text>
                
                <View style={styles.passwordRequirementItem}>
                  <Ionicons 
                    name={lengthValid ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={18} 
                    color={lengthValid ? colors.primary : colors.textPlaceholder} 
                    style={{marginRight: 8}} 
                  />
                  <Text style={dynamicStyles.requirementText}>At least 8 characters</Text>
                </View>
                
                <View style={styles.passwordRequirementItem}>
                  <Ionicons 
                    name={hasUppercase ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={18} 
                    color={hasUppercase ? colors.primary : colors.textPlaceholder} 
                    style={{marginRight: 8}} 
                  />
                  <Text style={dynamicStyles.requirementText}>Contains uppercase letter</Text>
                </View>
                
                <View style={styles.passwordRequirementItem}>
                  <Ionicons 
                    name={hasLowercase ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={18} 
                    color={hasLowercase ? colors.primary : colors.textPlaceholder} 
                    style={{marginRight: 8}} 
                  />
                  <Text style={dynamicStyles.requirementText}>Contains lowercase letter</Text>
                </View>
                
                <View style={styles.passwordRequirementItem}>
                  <Ionicons 
                    name={hasNumber ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={18} 
                    color={hasNumber ? colors.primary : colors.textPlaceholder} 
                    style={{marginRight: 8}} 
                  />
                  <Text style={dynamicStyles.requirementText}>Contains a number</Text>
                </View>
                
                {/* Password strength bar */}
                <View style={styles.strengthBarContainer}>
                  <View style={[styles.strengthBarBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.strengthBar, 
                        { 
                          width: `${passwordStrength}%`,
                          backgroundColor: getStrengthColor(passwordStrength)
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={dynamicStyles.passwordInputContainer}>
              <TextInput
                style={dynamicStyles.passwordInput}
                placeholder="Password"
                placeholderTextColor={colors.textPlaceholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  
                  // Update validation states
                  setLengthValid(text.length >= 8);
                  setHasUppercase(/[A-Z]/.test(text));
                  setHasLowercase(/[a-z]/.test(text));
                  setHasNumber(/[0-9]/.test(text));
                  setPasswordsMatch(text === confirmPassword && text.length > 0);
                  
                  // Calculate strength
                  let strength = 0;
                  if (text.length >= 8) strength += 25;
                  if (/[A-Z]/.test(text)) strength += 25;
                  if (/[a-z]/.test(text)) strength += 25;
                  if (/[0-9]/.test(text)) strength += 25;
                  setPasswordStrength(strength);
                }}
                secureTextEntry={!showPassword}
                textContentType={isLogin ? "password" : "newPassword"}
                autoComplete={isLogin ? "password" : "password-new"}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <View style={dynamicStyles.passwordInputContainer}>
                  <TextInput
                    style={dynamicStyles.passwordInput}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textPlaceholder}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setPasswordsMatch(password === text && text.length > 0);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                
                {!isLogin && password.length > 0 && confirmPassword.length > 0 && (
                  <View style={styles.passwordMatchContainer}>
                    <Ionicons 
                      name={passwordsMatch ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={passwordsMatch ? colors.primary : colors.error} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={[styles.passwordMatchText, { color: passwordsMatch ? colors.success : colors.error }]}>
                      {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                    </Text>
                  </View>
                )}
                <View style={styles.privacyPolicyContainer}>
                  <Switch
                    value={privacyPolicyAgreed}
                    onValueChange={setPrivacyPolicyAgreed}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={privacyPolicyAgreed ? colors.primary : colors.surface}
                  />
                  <View style={styles.privacyTextContainer}>
                    <Text style={dynamicStyles.privacyText}>I agree to the </Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Privacy')}
                    >
                      <Text style={[styles.privacyLink, { color: colors.primary }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}</Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setErrorMessage('');
              }}
            >
              <Text style={[styles.switchModeText, { color: colors.primary }]}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>OR</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            <TouchableOpacity style={dynamicStyles.guestButton} onPress={handleGuestAccess}>
              <Text style={[styles.guestButtonText, { color: colors.primary }]}>Continue as Guest</Text>
              <Text style={dynamicStyles.guestButtonSubtext}>Explore preset cities without an account</Text>
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
  forgotPasswordContainer: {
    marginTop: 15,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#FF5722',
    fontSize: 14,
  },
  passwordRequirementsContainer: {
    backgroundColor: 'rgba(255, 87, 34, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  passwordRequirementsTitle: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementText: {
    color: '#666',
    fontSize: 13,
  },
  strengthBarContainer: {
    marginTop: 15,
  },
  strengthBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
    marginRight: 5,
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  passwordMatchText: {
    fontSize: 14,
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
