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
import TourParametersScreen from './src/screens/TourParametersScreen';
import GuestTourParametersScreen from './src/screens/GuestTourParametersScreen';

// Import auth services
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, REGION } from './src/constants/config';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID
});

// Create contexts for the app
const AuthContext = createContext();
const TourContext = createContext();
export { AuthContext, TourContext };

// Create navigator
const Stack = createStackNavigator();

// Storage keys
const AUTH_STATE_KEY = 'tensortours_auth_state';
const USER_DATA_KEY = 'tensortours_user_data';
const TOUR_PARAMS_KEY = 'tensortours_tour_params';

// Dummy component to fix reference error
const MainTabNavigator = () => null;



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tourParams, setTourParams] = useState({ duration: 60, category: 'History' });

  // Save auth state to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveAuthState();
    }
  }, [isAuthenticated, user]);
  
  // Save tour parameters to AsyncStorage whenever they change
  useEffect(() => {
    saveTourParams();
  }, [tourParams]);

  // Load auth state and tour parameters from AsyncStorage on app start
  useEffect(() => {
    loadAuthState();
    loadTourParams();
  }, []);

  // Save authentication state to AsyncStorage
  const saveAuthState = async () => {
    try {
      await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(isAuthenticated));
      
      // Only save user data if authenticated and user exists
      if (isAuthenticated && user) {
        // We can't store the full user object, so we'll store essential info
        const userData = {
          username: user.username,
          // Add any other necessary user data here
        };
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  // Load authentication state from AsyncStorage
  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      
      // First try to load from AsyncStorage
      const storedAuthState = await AsyncStorage.getItem(AUTH_STATE_KEY);
      const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);
      
      if (storedAuthState === 'true' || storedAuthState === true) {
        // If we have stored auth state, restore it
        setIsAuthenticated(true);
        
        if (storedUserData) {
          // Restore basic user data
          const userData = JSON.parse(storedUserData);
          
          // Now try to get the actual Cognito user
          const cognitoUser = userPool.getCurrentUser();
          if (cognitoUser) {
            // Verify the session is still valid with Cognito
            cognitoUser.getSession((err, session) => {
              if (err || !session.isValid()) {
                // If there's an error or session is invalid, try to refresh
                handleSessionRefresh(cognitoUser);
              } else {
                // Session is valid, set the user
                setUser(cognitoUser);
                setIsLoading(false);
              }
            });
          } else {
            // We have stored auth but no Cognito user - this is a mismatch
            // Keep the user logged in with basic data for better UX
            setUser({ username: userData.username });
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        // No stored auth state, check Cognito as fallback
        checkCognitoSession();
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      checkCognitoSession();
    }
  };

  // Handle session refresh
  const handleSessionRefresh = (cognitoUser) => {
    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error('Error getting session:', err);
        handleLogout();
        return;
      }
      
      const refreshToken = session.getRefreshToken();
      if (refreshToken) {
        cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
          if (refreshErr) {
            console.error('Error refreshing session:', refreshErr);
            handleLogout();
          } else {
            console.log('Session refreshed successfully');
            setUser(cognitoUser);
            setIsAuthenticated(true);
          }
          setIsLoading(false);
        });
      } else {
        handleLogout();
      }
    });
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

  // Fallback to check Cognito session directly
  const checkCognitoSession = () => {

    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
      cognitoUser.getSession((err, session) => {
        if (err) {
          console.error('Session error:', err);
          handleLogout();
          return;
        }
        
        if (session.isValid()) {
          setUser(cognitoUser);
          setIsAuthenticated(true);
        } else {
          handleSessionRefresh(cognitoUser);
        }
        setIsLoading(false);
      });
    } else {
      handleLogout();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false);
    
    // Clear stored auth state
    try {
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  // Function to check if user is authenticated (replaced by above functions)
  function checkAuthStatus() {
    checkCognitoSession();
  }
  
  // Auth context value
  const authContext = {
    signIn: (username, password) => {
      return new Promise((resolve, reject) => {
        const authDetails = new AuthenticationDetails({
          Username: username,
          Password: password
        });
        
        const cognitoUser = new CognitoUser({
          Username: username,
          Pool: userPool
        });
        
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (result) => {
            setUser(cognitoUser);
            setIsAuthenticated(true);
            resolve(result);
          },
          onFailure: (err) => {
            reject(err);
          }
        });
      });
    },
    signOut: () => {
      if (user) {
        user.signOut();
        handleLogout();
      }
    },
    signUp: (username, password, email) => {
      return new Promise((resolve, reject) => {
        userPool.signUp(username, password, [
          { Name: 'email', Value: email }
        ], null, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      });
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
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthContext.Provider value={authContext}>
        <TourContext.Provider value={{ tourParams, setTourParams }}>
          <NavigationContainer>
            <Stack.Navigator>
              {isAuthenticated ? (
                // Authenticated user flow
                <>
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
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </TourContext.Provider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}