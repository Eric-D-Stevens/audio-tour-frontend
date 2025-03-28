import React, { useState, useEffect, createContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import AudioScreen from './src/screens/AudioScreen';
import AuthScreen from './src/screens/AuthScreen';
import CityPreviewScreen from './src/screens/CityPreviewScreen';

// Import auth services
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, REGION } from './src/constants/config';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID
});

// Create auth context for the app
const AuthContext = createContext();
export { AuthContext };

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator (post-authentication)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Explore" component={CityPreviewScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check if user is authenticated
  function checkAuthStatus() {
    setIsLoading(true);
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
      cognitoUser.getSession((err, session) => {
        if (err) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        if (session.isValid()) {
          setUser(cognitoUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      });
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
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
        setUser(null);
        setIsAuthenticated(false);
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
    user
  };

  // Show loading screen if still checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator>
          {isAuthenticated ? (
            // Authenticated user flow
            <>
              <Stack.Screen 
                name="Main" 
                component={MainTabNavigator} 
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Audio" component={AudioScreen} />
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
                name="CityPreview" 
                component={CityPreviewScreen} 
                options={{ title: 'City Preview' }}
              />
            </>
          )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}