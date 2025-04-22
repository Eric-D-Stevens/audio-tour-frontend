import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import UserMapScreen from './src/screens/UserMapScreen';
import GuestMapScreen from './src/screens/GuestMapScreen';
import AudioScreen from './src/screens/AudioScreen';
import GuestAudioScreen from './src/screens/GuestAudioScreen';
import AuthScreen from './src/screens/AuthScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import TourParametersScreen from './src/screens/TourParametersScreen';
import GuestTourParametersScreen from './src/screens/GuestTourParametersScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactScreen from './src/screens/ContactScreen';

// Import auth services
import * as AuthService from './src/services/auth';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, REGION } from './src/constants/config';

// Import contexts from the separate contexts file
import { AuthContext, TourContext } from './src/contexts';

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

  // Load auth state and tour parameters on app start
  useEffect(() => {
    checkAuthStatus();
    loadTourParams();
    loadGuestTourParams();
  }, []);

  // Check authentication status using the enhanced secure auth service
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated using the auth service (returns detailed status)
      const { isAuthenticated: userAuthenticated, error: authError } = await AuthService.isAuthenticated();
      
      if (userAuthenticated) {
        console.log('User is authenticated');
        // Get user data from storage
        const userData = await AuthService.getCurrentUserData();
        const cognitoUser = AuthService.getCurrentUser();
        
        setIsAuthenticated(true);
        setUser(userData || cognitoUser || { username: 'User' });
      } else {
        // Not authenticated with potential error reason
        console.log('User is not authenticated:', authError || 'No reason provided');
        setIsAuthenticated(false);
        setUser(null);
        
        // If there was a specific auth error, we could show it to the user
        if (authError) {
          console.warn('Authentication error:', authError);
          // Could set an auth error state here to display in UI if needed
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
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
      console.error('Error saving tour parameters:', error);
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
      console.error('Error loading tour parameters:', error);
    }
  };
  
  // Save guest tour parameters to AsyncStorage
  const saveGuestTourParams = async () => {
    try {
      await AsyncStorage.setItem(GUEST_TOUR_PARAMS_KEY, JSON.stringify(guestTourParams));
    } catch (error) {
      console.error('Error saving guest tour parameters:', error);
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
      console.error('Error loading guest tour parameters:', error);
    }
  };

  // Handle logout using the auth service
  const handleLogout = async (clearRememberMe = false) => {
    try {
      console.log('Logging out user...');
      // Sign out and update state, passing the clearRememberMe flag
      await AuthService.signOut(clearRememberMe);
      
      // Update authentication state which will trigger navigator change
      setIsAuthenticated(false);
      setUser(null);
      // Note: initialRoute is now determined dynamically based on isAuthenticated
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  // Auth context value - using the enhanced secure auth service
  const authContext = {
    signIn: async (username, password, rememberMe) => {
      try {
        const result = await AuthService.signIn(username, password, rememberMe);
        setUser(await AuthService.getCurrentUserData());
        setIsAuthenticated(true);
        return result;
      } catch (error) {
        throw error;
      }
    },
    signOut: async (clearRememberMe = false) => {
      // Pass the clearRememberMe flag to handleLogout
      await handleLogout(clearRememberMe);
    },
    signUp: (username, password, email) => {
      return AuthService.signUp(username, password, email);
    },
    confirmSignUp: (username, code) => {
      return AuthService.confirmSignUp(username, code);
    },
    resendConfirmationCode: (username) => {
      return AuthService.resendConfirmationCode(username);
    },
    checkAuthAndRedirect: async (navigation) => {
      // Function to check auth status and redirect to login if needed
      const { isAuthenticated: stillAuthenticated, error } = await AuthService.isAuthenticated();
      
      if (!stillAuthenticated) {
        console.warn('Session expired or invalid, redirecting to login');
        
        // First update the authentication state
        setIsAuthenticated(false);
        setUser(null);
        
        // If navigation is available, show error and handle redirection
        if (navigation) {
          // Provide a reason via alert if possible
          const errorMessage = error 
            ? `Your session has expired: ${error}` 
            : 'Your session has expired. Please log in again.';
            
          // Show alert and let the user know they need to log in again
          Alert.alert('Session Expired', errorMessage, [
            { text: 'OK', onPress: () => {
              // We don't need to explicitly navigate since the state change will
              // trigger a re-render with the unauthenticated navigation stack
              // The next render cycle will show the Auth screen automatically
              console.log('Authentication state updated, App will render Auth screen');
            }}
          ]);
        }
        
        return false;
      }
      return true; // Auth is still valid
    },
    isAuthenticated,
    user,
    handleLogout
  };

  // Show loading screen if still checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5722" />{/* Orange color for TensorTours branding */}
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <AuthContext.Provider value={authContext}>
        <TourContext.Provider value={{ tourParams, setTourParams, guestTourParams, setGuestTourParams }}>
          <NavigationContainer 
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            theme={{
              colors: {
                background: '#FFFFFF',
                card: '#FFFFFF',
                border: '#FFFFFF',
                primary: '#FF5722',
                text: '#000000'
              }
            }}>
            <Stack.Navigator
              initialRouteName={isAuthenticated ? "Map" : "Auth"}
              screenOptions={{
                cardStyle: { backgroundColor: '#FFFFFF' },
                headerStyle: { backgroundColor: '#FFFFFF' },
                contentStyle: { backgroundColor: '#FFFFFF' }
              }}>
              {isAuthenticated ? (
                // Authenticated user flow
                <>
                  <Stack.Screen 
                    name="Map" 
                    component={UserMapScreen} 
                    options={{ headerShown: false, unmountOnBlur: true }}
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
                    name="About" 
                    component={AboutScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="Contact" 
                    component={ContactScreen} 
                    options={{ headerShown: false }}
                  />
                </>
              ) : (
                // Unauthenticated user flow
                <>
                  <Stack.Screen 
                    name="Auth" 
                    component={AuthScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="EmailVerification" 
                    component={EmailVerificationScreen} 
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
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </TourContext.Provider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}