import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import custom logger utility
import logger from './src/utils/logger';

// Import network context and offline screen
import { NetworkProvider, useNetwork } from './src/context/NetworkContext';
import OfflineScreen from './src/components/OfflineScreen';

// Import screens
import UserMapScreen from './src/screens/UserMapScreen';
import GuestMapScreen from './src/screens/GuestMapScreen';
import AudioScreen from './src/screens/AudioScreen';
import GuestAudioScreen from './src/screens/GuestAudioScreen';
import AuthScreen from './src/screens/AuthScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import TourParametersScreen from './src/screens/TourParametersScreen';
import GuestTourParametersScreen from './src/screens/GuestTourParametersScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactScreen from './src/screens/ContactScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import SupportScreen from './src/screens/SupportScreen';

// Import auth services
import * as AuthService from './src/services/auth';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, REGION } from './src/constants/config';

// Import contexts from the separate contexts file
import { AuthContext, TourContext, ThemeProvider, useTheme } from './src/contexts';

// Create navigator
const Stack = createStackNavigator();

// Storage keys
const TOUR_PARAMS_KEY = 'tensortours_tour_params';
const GUEST_TOUR_PARAMS_KEY = 'tensortours_guest_tour_params';

// Dummy component to fix reference error
const MainTabNavigator = () => null;



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  // Remove the initialRoute state as we'll determine it dynamically
  const [tourParams, setTourParams] = useState({ distance: 1448, numAttractions: 15, category: 'history' });
  const [guestTourParams, setGuestTourParams] = useState({ cityId: 'san-francisco', category: 'history' });

  // Save tour parameters to AsyncStorage whenever they change
  useEffect(() => {
    saveTourParams();
  }, [tourParams]);
  
  // Save guest tour parameters to AsyncStorage whenever they change
  useEffect(() => {
    saveGuestTourParams();
  }, [guestTourParams]);

  // Initialize app: OTA updates -> Auth check
  useEffect(() => {
    const initializeApp = async () => {
      await checkForOTAUpdates();
      checkAuthStatus();
      loadTourParams();
      loadGuestTourParams();
    };
    initializeApp();
  }, []);

  // Check for OTA updates and apply immediately on app open
  const checkForOTAUpdates = async () => {
    if (__DEV__) {
      logger.debug('Skipping OTA update check in development mode');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        logger.info('OTA update available, downloading...');
        await Updates.fetchUpdateAsync();
        logger.info('Update downloaded, reloading app...');
        await Updates.reloadAsync();
      }
    } catch (error) {
      logger.error('Error checking for OTA updates:', error);
    }
  };

  // Check authentication status using the enhanced secure auth service
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated using the auth service (returns detailed status)
      const { isAuthenticated: userAuthenticated, error: authError } = await AuthService.isAuthenticated();
      
      if (userAuthenticated) {
        logger.info('User is authenticated');
        // Get user data from storage
        const userData = await AuthService.getCurrentUserData();
        const cognitoUser = AuthService.getCurrentUser();
        
        setIsAuthenticated(true);
        setUser(userData || cognitoUser || { username: 'User' });
      } else {
        // Not authenticated with potential error reason
        logger.info('User is not authenticated:', authError || 'No reason provided');
        setIsAuthenticated(false);
        setUser(null);
        
        // If there was a specific auth error, we could show it to the user
        if (authError) {
          logger.warn('Authentication error:', authError);
          // Could set an auth error state here to display in UI if needed
        }
      }
    } catch (error) {
      logger.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Save tour parameters to AsyncStorage
  const saveTourParams = async () => {
    try {
      await AsyncStorage.setItem(TOUR_PARAMS_KEY, JSON.stringify(tourParams));
    } catch (error) {
      logger.error('Error saving tour parameters:', error);
    }
  };

  // Load tour parameters from AsyncStorage
  const loadTourParams = async () => {
    try {
      const storedTourParams = await AsyncStorage.getItem(TOUR_PARAMS_KEY);
      if (storedTourParams) {
        setTourParams(JSON.parse(storedTourParams));
      }
    } catch (error) {
      logger.error('Error loading tour parameters:', error);
    }
  };
  
  // Save guest tour parameters to AsyncStorage
  const saveGuestTourParams = async () => {
    try {
      await AsyncStorage.setItem(GUEST_TOUR_PARAMS_KEY, JSON.stringify(guestTourParams));
    } catch (error) {
      logger.error('Error saving guest tour parameters:', error);
    }
  };

  // Load guest tour parameters from AsyncStorage
  const loadGuestTourParams = async () => {
    try {
      const storedGuestTourParams = await AsyncStorage.getItem(GUEST_TOUR_PARAMS_KEY);
      if (storedGuestTourParams) {
        setGuestTourParams(JSON.parse(storedGuestTourParams));
      }
    } catch (error) {
      logger.error('Error loading guest tour parameters:', error);
    }
  };

  // Navigation reference to use for navigation actions
  const navigationRef = useRef();

  // Handle logout using the auth service
  const handleLogout = async () => {
    try {
      logger.info('Logging out user...');
      // Sign out and update state
      await AuthService.signOut();
      
      // First navigate to the Auth screen
      if (navigationRef.current) {
        navigationRef.current.navigate('Auth');
      }
      
      // Then update authentication state
      setIsAuthenticated(false);
      setUser(null);
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  };
  
  // Auth context value - using the enhanced secure auth service
  const authContext = {
    signIn: async (username, password, rememberMe) => {
      try {
        const result = await AuthService.signIn(username, password, rememberMe);
        setUser(await AuthService.getCurrentUserData());
        setIsAuthenticated(true);
        
        // Navigate to Map screen after successful authentication
        if (navigationRef.current) {
          navigationRef.current.navigate('Map');
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    signOut: async () => {
      // Handle logout
      await handleLogout();
    },
    signUp: (username, password, email, policyVersion, consentTimestamp) => {
      return AuthService.signUp(username, password, email, policyVersion, consentTimestamp);
    },
    confirmSignUp: (username, code) => {
      return AuthService.confirmSignUp(username, code);
    },
    resendConfirmationCode: (username) => {
      return AuthService.resendConfirmationCode(username);
    },
    forgotPassword: (username) => {
      return AuthService.forgotPassword(username);
    },
    confirmNewPassword: (username, code, newPassword) => {
      return AuthService.confirmNewPassword(username, code, newPassword);
    },
    checkAuthAndRedirect: async (navigation) => {
      try {
        // Only check if the token is valid first without forcing a refresh
        const authResult = await AuthService.isAuthenticated();
        
        if (authResult.isAuthenticated) {
          // Token is still valid, no need to refresh
          return true;
        }
        
        // Only try to refresh if the current token is invalid
        const refreshResult = await AuthService.refreshTokenIfNeeded(false); // Don't force refresh
        
        if (refreshResult.token) {
          // If we successfully refreshed the token, auth is valid
          logger.debug('Token refreshed after expiration');
          return true;
        }
        
        // Final authentication check is already done above, token is invalid
        logger.warn('Session expired or invalid, redirecting to login');
        
        // First update the authentication state
        setIsAuthenticated(false);
        setUser(null);
        
        // Use the navigationRef for direct navigation
        if (navigationRef.current) {
          // Navigate to Auth screen directly
          navigationRef.current.navigate('Auth');
        }
        
        // If navigation is available, show error and handle redirection
        if (navigation) {
          // Provide a reason via alert if possible
          const errorMessage = authResult.error 
            ? `Your session has expired: ${authResult.error}` 
            : 'Your session has expired. Please log in again.';
            
          // Show alert and let the user know they need to log in again
          Alert.alert('Session Expired', errorMessage, [
            { text: 'OK', onPress: () => {
              logger.info('User acknowledged session expiration');
            }}
          ]);
        }
        
        return false;
      } catch (error) {
        logger.error('Error in checkAuthAndRedirect:', error);
        return false; // Auth check failed, assume not authenticated
      }
    },
    isAuthenticated,
    user,
    handleLogout,
    deleteAccount: async () => {
      try {
        await AuthService.deleteAccount();
        
        // First navigate to Auth screen
        if (navigationRef.current) {
          navigationRef.current.navigate('Auth');
        }
        
        // After successful deletion, clear local state
        setUser(null);
        setIsAuthenticated(false);
        
        return true;
      } catch (error) {
        logger.error('Error deleting account:', error);
        throw error;
      }
    }
  };

  // Loading screen is now handled in the AppContent component

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <NetworkProvider>
          <AppContent 
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
            authContext={authContext}
            tourParams={tourParams}
            setTourParams={setTourParams}
            guestTourParams={guestTourParams}
            setGuestTourParams={setGuestTourParams}
            navigationRef={navigationRef}
          />
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Separate component to use the network context inside
const AppContent = ({ isLoading, isAuthenticated, authContext, tourParams, setTourParams, guestTourParams, setGuestTourParams, navigationRef }) => {
  const { isConnected } = useNetwork();
  const { colors, isDark } = useTheme();
  
  // If we're not connected to the internet, show the offline screen
  if (!isConnected) {
    return <OfflineScreen />;
  }
  
  // Show loading screen while initializing (tracking + auth are awaited sequentially in App.js)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
      <AuthContext.Provider value={authContext}>
        <TourContext.Provider value={{ tourParams, setTourParams, guestTourParams, setGuestTourParams }}>
          <NavigationContainer 
            ref={navigationRef}
            theme={{
              dark: isDark,
              colors: {
                background: colors.background,
                card: colors.card,
                border: colors.border,
                primary: colors.primary,
                text: colors.text,
                notification: colors.primary,
              },
              fonts: {
                regular: {
                  fontFamily: 'System',
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: 'System',
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: 'System',
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: 'System',
                  fontWeight: '900',
                },
              },
            }}>
            <Stack.Navigator
              initialRouteName={isAuthenticated ? "Map" : "Auth"}
              screenOptions={{
                cardStyle: { backgroundColor: colors.background },
                headerStyle: { backgroundColor: colors.card },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.background }
              }}>
              {/* All screens available regardless of auth state, but we'll control access in the components */}
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="EmailVerification" 
                component={EmailVerificationScreen} 
                options={{
                  title: 'Verify Your Email',
                  headerStyle: {
                    backgroundColor: '#FF5722',
                  },
                  headerTintColor: '#FFFFFF',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
              <Stack.Screen 
                name="ForgotPassword" 
                component={ForgotPasswordScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Map" 
                component={UserMapScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="TourParameters" 
                component={TourParametersScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Audio" 
                component={AudioScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="GuestMap" 
                component={GuestMapScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="GuestTourParameters" 
                component={GuestTourParametersScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="GuestAudio" 
                component={GuestAudioScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="About" 
                component={AboutScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Contact" 
                component={ContactScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Support" 
                component={SupportScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Privacy" 
                component={PrivacyPolicyScreen} 
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </TourContext.Provider>
      </AuthContext.Provider>
  );
}