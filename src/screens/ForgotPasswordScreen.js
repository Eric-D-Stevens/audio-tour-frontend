import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts';
import logger from '../utils/logger';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email entry, 2: Verification and new password
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Show/hide password states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation states
  const [lengthValid, setLengthValid] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const auth = useContext(AuthContext);

  // Similar to registration, validate password as user types
  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    
    setLengthValid(hasMinLength);
    setHasUppercase(hasUpper);
    setHasLowercase(hasLower);
    setHasNumber(hasNum);
    
    // Calculate strength percentage based on criteria met
    let strength = 0;
    if (hasMinLength) strength += 25;
    if (hasUpper) strength += 25;
    if (hasLower) strength += 25;
    if (hasNum) strength += 25;
    
    setPasswordStrength(strength);
    
    // Check if passwords match when both have been entered
    if (confirmNewPassword) {
      setPasswordsMatch(password === confirmNewPassword);
    }
  };

  // Check if passwords match when confirming
  const checkPasswordMatch = (confirmPass) => {
    setPasswordsMatch(newPassword === confirmPass);
  };

  // Handle submit for step 1 (email entry)
  const handleSendCode = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await auth.forgotPassword(email);
      setSuccessMessage('Verification code sent to your email');
      setStep(2);
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      setErrorMessage(error.message || 'Error sending verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit for step 2 (verification code and new password)
  const handleResetPassword = async () => {
    if (!verificationCode || !newPassword || !confirmNewPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (passwordStrength < 100) {
      setErrorMessage('Password must meet all requirements');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await auth.confirmNewPassword(email, verificationCode, newPassword);
      setSuccessMessage('Password reset successful');
      
      // Navigate back to login after a slight delay
      setTimeout(() => {
        navigation.navigate('Auth', { resetSuccess: true });
      }, 1500);
    } catch (error) {
      logger.error('Error confirming password reset:', error);
      setErrorMessage(error.message || 'Error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  // Get color based on strength percentage - same as in AuthScreen
  const getStrengthColor = (percentage) => {
    if (percentage < 25) return '#E0E0E0'; // Light gray
    if (percentage < 50) return '#FFCBB3'; // Lightest orange
    if (percentage < 75) return '#FFA579'; // Light orange
    if (percentage < 100) return '#FF8F59'; // Medium orange
    return '#FF5722'; // TensorTours orange
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FF5722" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Reset Password</Text>
            <Text style={styles.formSubtitle}>
              {step === 1 
                ? 'Enter your email to receive a verification code' 
                : 'Enter the verification code and your new password'}
            </Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} style={styles.successIcon} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              // Step 1: Email entry
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleSendCode}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Step 2: Verification code and new password
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  editable={!isLoading}
                />

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      validatePassword(text);
                    }}
                    secureTextEntry={!showNewPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChangeText={(text) => {
                      setConfirmNewPassword(text);
                      checkPasswordMatch(text);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordRequirementsContainer}>
                  <Text style={styles.passwordRequirementsTitle}>Password requirements:</Text>
                  
                  <View style={styles.passwordRequirementItem}>
                    <Ionicons 
                      name={lengthValid ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={18} 
                      color={lengthValid ? "#FF5722" : "#AAAAAA"} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={styles.requirementText}>At least 8 characters</Text>
                  </View>
                  
                  <View style={styles.passwordRequirementItem}>
                    <Ionicons 
                      name={hasUppercase ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={18} 
                      color={hasUppercase ? "#FF5722" : "#AAAAAA"} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={styles.requirementText}>Contains uppercase letter</Text>
                  </View>
                  
                  <View style={styles.passwordRequirementItem}>
                    <Ionicons 
                      name={hasLowercase ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={18} 
                      color={hasLowercase ? "#FF5722" : "#AAAAAA"} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={styles.requirementText}>Contains lowercase letter</Text>
                  </View>
                  
                  <View style={styles.passwordRequirementItem}>
                    <Ionicons 
                      name={hasNumber ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={18} 
                      color={hasNumber ? "#FF5722" : "#AAAAAA"} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={styles.requirementText}>Contains a number</Text>
                  </View>
                  
                  <View style={styles.passwordRequirementItem}>
                    <Ionicons 
                      name={passwordsMatch ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={18} 
                      color={passwordsMatch ? "#FF5722" : "#AAAAAA"} 
                      style={{marginRight: 8}} 
                    />
                    <Text style={styles.requirementText}>Passwords match</Text>
                  </View>
                  
                  {/* Password strength bar */}
                  <View style={styles.strengthBarContainer}>
                    <View style={styles.strengthBarBackground}>
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

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.linkText}>Back to Login</Text>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  backButtonText: {
    color: '#FF5722',
    marginLeft: 5,
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF5722', // TensorTours orange
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#FFB399', // Lighter orange
  },
  linkContainer: {
    marginTop: 15,
    padding: 10,
  },
  linkText: {
    color: '#FF5722', // TensorTours orange
    fontSize: 16,
  },
  errorContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBE6',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  errorIcon: {
    color: '#FF5722',
    marginRight: 10,
  },
  errorText: {
    color: '#333333',
    flex: 1,
  },
  successContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7ED',
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  successIcon: {
    color: '#28A745',
    marginRight: 10,
  },
  successText: {
    color: '#333333',
    flex: 1,
  },
  passwordRequirementsContainer: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
  strengthBarContainer: {
    marginTop: 10,
    width: '100%',
  },
  strengthBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 4,
  },
  passwordInputContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingHorizontal: 15,
  },
  passwordToggle: {
    padding: 10,
    marginRight: 5,
  },
});

export default ForgotPasswordScreen;
