import React, { useState, useEffect, createContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import AuthScreen from './src/screens/AuthScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import TourParametersScreen from './src/screens/TourParametersScreen';
import GuestTourParametersScreen from './src/screens/GuestTourParametersScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactScreen from './src/screens/ContactScreen';

// Import auth services
import * as AuthService from './src/services/auth';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, REGION } from './src/constants/config';

// Auth service is already initialized in ./src/services/auth.js

// Create contexts for the app
const AuthContext = createContext();
const TourContext = createContext();
export { AuthContext, TourContext };

// Create navigator
const Stack = createStackNavigator();

// Storage keys
const TOUR_PARAMS_KEY = 'tensortours_tour_params';

// Dummy component to fix reference error
const MainTabNavigator = () => null;



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tourParams, setTourParams] = useState({ distance: 1448, numAttractions: 15, category: 'history' });

  // Save tour parameters to AsyncStorage whenever they change
  useEffect(() => {
    saveTourParams();
  }, [tourParams]);

  // Load auth state and tour parameters on app start
  useEffect(() => {
    checkAuthStatus();
    loadTourParams();
  }, []);

  // Check authentication status using the improved auth service
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated using the auth service
      const isUserAuthenticated = await AuthService.isAuthenticated();
      
      if (isUserAuthenticated) {
        // Get user data from storage
        const userData = await AuthService.getCurrentUserData();
        const cognitoUser = AuthService.getCurrentUser();
        
        setIsAuthenticated(true);
        setUser(userData || cognitoUser || { username: 'User' });
      } else {
        // Not authenticated
        setIsAuthenticated(false);
        setUser(null);
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

  // Handle logout using the auth service
  const handleLogout = async (navigation) => {
    try {
      await AuthService.signOut();
      setIsAuthenticated(false);
      setUser(null);
      
      // If navigation is provided, explicitly navigate to Auth screen
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }]
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  // Auth context value - using the improved auth service
  const authContext = {
    signIn: async (username, password) => {
      try {
        const result = await AuthService.signIn(username, password);
        setUser(await AuthService.getCurrentUserData());
        setIsAuthenticated(true);
        return result;
      } catch (error) {
        throw error;
      }
    },
    signOut: async () => {
      await handleLogout();
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
        <TourContext.Provider value={{ tourParams, setTourParams }}>
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
                // Authentication flow
                <>
                  <Stack.Screen 
                    name="Auth" 
                    component={AuthScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="EmailVerification" 
                    component={EmailVerificationScreen} 
                    options={{
                      headerShown: true,
                      title: 'Verify Email',
                      headerStyle: {
                        backgroundColor: '#FF5722',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen 
                    name="Map" 
                    component={GuestMapScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="GuestTourParameters" 
                    component={GuestTourParametersScreen} 
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
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </TourContext.Provider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}