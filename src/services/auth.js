import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from '../constants/config';

// Constants for storage keys
const AUTH_TOKENS_KEY = 'tensortours_auth_tokens'; // Secure storage
const REFRESH_TOKEN_KEY = 'tensortours_refresh_token'; // Secure storage
const USER_DATA_KEY = 'tensortours_user_data'; // Regular storage for non-sensitive user data
const AUTH_STATE_KEY = 'tensortours_auth_state'; // For tracking auth state across app refreshes

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID
});

/**
 * Get the current authentication token, prioritizing locally stored tokens
 * @returns {Promise<{token: string|null, error: string|null}>} - Auth token or null if not authenticated, with optional error
 */
export const getAuthToken = async () => {
  try {
    console.log('Getting auth token...');
    // First try to get token from SecureStore
    const authData = await SecureStore.getItemAsync(AUTH_TOKENS_KEY);
    
    if (authData) {
      console.log('Found stored auth data');
      const { idToken, expiration } = JSON.parse(authData);
      
      // Check if token is still valid based on expiration time
      const now = Date.now();
      // Add a 5-minute buffer to ensure we refresh before actual expiration
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      console.log(`Token expiration check: expires at ${new Date(expiration).toISOString()}, now is ${new Date(now).toISOString()}`);
      
      if (expiration > now + bufferTime) {
        console.log('Using stored token - still valid');
        return { token: idToken, error: null }; // Return stored token if not expired
      } else {
        console.log('Stored token is expired or expiring soon, attempting refresh');
      }
      
      // If token is expired or expiring soon, try to refresh it
      const refreshResult = await refreshTokenIfNeeded();
      if (refreshResult.token) {
        console.log('Successfully refreshed token');
        return { token: refreshResult.token, error: null };
      } else {
        console.log('Token refresh failed:', refreshResult.error);
        // If refresh fails with a specific reason, return it
        return { token: null, error: refreshResult.error || 'Token refresh failed' };
      }
    } else {
      console.log('No stored auth data found');
    }
    
    // If no stored token or refresh failed, fall back to Cognito session check
    console.log('Falling back to Cognito session check');
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      console.log('No current Cognito user found');
      return { token: null, error: 'No active user session' };
    }
    
    console.log(`Current Cognito user found: ${cognitoUser.getUsername()}`);
    return new Promise((resolve) => {
      cognitoUser.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          console.error('Session error or invalid:', err);
          resolve({ 
            token: null, 
            error: err ? err.message || 'Session invalid' : 'Session invalid' 
          });
          return;
        }
        
        console.log('Valid Cognito session found');
        // Get the token and store it with expiration time
        const idToken = session.getIdToken().getJwtToken();
        const expiration = session.getIdToken().getExpiration() * 1000; // Convert to milliseconds
        const refreshToken = session.getRefreshToken().getToken();
        
        console.log(`New token obtained from Cognito, expires: ${new Date(expiration).toISOString()}`);
        // Store the tokens for future use
        storeTokens(idToken, expiration, refreshToken);
        
        resolve({ token: idToken, error: null });
      });
    });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { token: null, error: error.message || 'Unknown auth error' };
  }
};

/**
 * Store authentication tokens in SecureStore for better security
 * @param {string} idToken - ID token from Cognito
 * @param {number} expiration - Expiration timestamp in milliseconds
 * @param {string} refreshToken - Refresh token for obtaining new tokens
 */
const storeTokens = async (idToken, expiration, refreshToken) => {
  try {
    // Store ID token and expiration in SecureStore
    await SecureStore.setItemAsync(
      AUTH_TOKENS_KEY, 
      JSON.stringify({
        idToken,
        expiration
      })
    );
    
    // Store refresh token separately for even better security
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    // Also update the auth state in AsyncStorage for quick checks
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
      isAuthenticated: true,
      lastAuthenticated: new Date().toISOString(),
      tokenExpiration: new Date(expiration).toISOString()
    }));
    
    console.log('Tokens stored securely');
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

/**
 * Try to refresh the token if it's expired but the refresh token is still valid
 * @returns {Promise<{token: string|null, error: string|null}>} - New ID token or null with error if refresh failed
 */
const refreshTokenIfNeeded = async () => {
  try {
    // First try using stored refresh token from SecureStore
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      return { token: null, error: 'No current user found' };
    }
    
    return new Promise((resolve) => {
      cognitoUser.getSession(async (err, session) => {
        if (err) {
          console.error('Error getting session for refresh:', err);
          
          // If we have a stored refresh token, try using it directly
          if (storedRefreshToken) {
            try {
              console.log('Attempting refresh with stored refresh token');
              const refreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
              
              cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
                if (refreshErr) {
                  console.error('Error refreshing with stored token:', refreshErr);
                  resolve({ token: null, error: 'Refresh token expired' });
                  return;
                }
                
                // Get the new token and store it
                const newIdToken = refreshedSession.getIdToken().getJwtToken();
                const newExpiration = refreshedSession.getIdToken().getExpiration() * 1000;
                const newRefreshToken = refreshedSession.getRefreshToken().getToken();
                
                storeTokens(newIdToken, newExpiration, newRefreshToken);
                console.log('Token refreshed successfully with stored refresh token');
                
                resolve({ token: newIdToken, error: null });
              });
            } catch (e) {
              console.error('Error using stored refresh token:', e);
              resolve({ token: null, error: 'Stored refresh token invalid' });
            }
          } else {
            resolve({ token: null, error: 'Session error' });
          }
          return;
        }
        
        if (!session) {
          resolve({ token: null, error: 'No session found' });
          return;
        }
        
        // Check if we have a refresh token from the session
        const refreshToken = session.getRefreshToken();
        if (!refreshToken) {
          if (storedRefreshToken) {
            // Try with stored refresh token as fallback
            console.log('No session refresh token, trying stored token');
            try {
              const storedToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
              cognitoUser.refreshSession(storedToken, (refreshErr, refreshedSession) => {
                if (refreshErr) {
                  console.error('Error refreshing with stored token:', refreshErr);
                  resolve({ token: null, error: 'All refresh tokens expired' });
                  return;
                }
                
                handleRefreshedSession(refreshedSession, resolve);
              });
            } catch (e) {
              resolve({ token: null, error: 'Invalid refresh token format' });
            }
          } else {
            resolve({ token: null, error: 'No refresh token available' });
          }
          return;
        }
        
        // Try to refresh the session with the session refresh token
        cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
          if (refreshErr) {
            console.error('Error refreshing session:', refreshErr);
            resolve({ token: null, error: refreshErr.message || 'Refresh failed' });
            return;
          }
          
          handleRefreshedSession(refreshedSession, resolve);
        });
      });
    });
  } catch (error) {
    console.error('Error in refreshTokenIfNeeded:', error);
    return { token: null, error: error.message || 'Unexpected refresh error' };
  }
};

// Helper function for handling a refreshed session
const handleRefreshedSession = (refreshedSession, resolve) => {
  // Get the new token and store it
  const newIdToken = refreshedSession.getIdToken().getJwtToken();
  const newExpiration = refreshedSession.getIdToken().getExpiration() * 1000;
  const newRefreshToken = refreshedSession.getRefreshToken().getToken();
  
  storeTokens(newIdToken, newExpiration, newRefreshToken);
  console.log('Token refreshed successfully');
  
  // Also update user data if needed
  const userData = {
    username: refreshedSession.getIdToken().payload['cognito:username'],
    email: refreshedSession.getIdToken().payload.email
  };
  storeUserData(userData);
  
  resolve({ token: newIdToken, error: null });
};

/**
 * Get the current authenticated user data from local storage
 * @returns {Promise<Object|null>} - User data or null if not available
 */
export const getCurrentUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    
    if (!userData) {
      // If we don't have cached user data, but the user is authenticated,
      // try to fetch it from Cognito
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        return new Promise((resolve) => {
          cognitoUser.getSession((err, session) => {
            if (err || !session || !session.isValid()) {
              resolve(null);
              return;
            }
            
            // Extract user data from the JWT token
            const idToken = session.getIdToken();
            const userData = {
              username: idToken.payload['cognito:username'] || idToken.payload.email,
              email: idToken.payload.email,
              sub: idToken.payload.sub
            };
            
            // Store it for future use
            storeUserData(userData);
            resolve(userData);
          });
        });
      }
    }
    
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Store user data in AsyncStorage
 * @param {Object} userData - User data to store
 */
export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Get the current authenticated user from Cognito
 * @returns {CognitoUser|null} - Cognito user object or null if not authenticated
 */
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

/**
 * Check if the user is authenticated by checking for a valid token
 * @returns {Promise<{isAuthenticated: boolean, error: string|null}>} - Authentication status and any error
 */
export const isAuthenticated = async () => {
  // Quick check without network requests
  try {
    const authState = await AsyncStorage.getItem(AUTH_STATE_KEY);
    if (authState) {
      const { isAuthenticated, tokenExpiration } = JSON.parse(authState);
      const now = new Date();
      const expiration = new Date(tokenExpiration);
      
      // If token is not expired (with 5-minute buffer), return cached auth state
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (isAuthenticated && expiration > new Date(now.getTime() + bufferTime)) {
        console.log('Using cached auth state - still valid');
        return { isAuthenticated: true, error: null };
      }
    }
  } catch (e) {
    console.log('Error reading cached auth state:', e);
    // Continue to token check if cache read fails
  }
  
  // If not in cache or expired, check token
  const { token, error } = await getAuthToken();
  return { 
    isAuthenticated: !!token, 
    error: token ? null : error 
  };
};

/**
 * Sign in a user and store their tokens and data securely
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Authentication result
 */
export const signIn = (username, password) => {
  console.log(`Attempting to sign in user: ${username}`);
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
        console.log('Authentication successful');
        // Store tokens securely
        const idToken = result.getIdToken().getJwtToken();
        const expiration = result.getIdToken().getExpiration() * 1000;
        const refreshToken = result.getRefreshToken().getToken();
        
        console.log(`Token obtained, expires: ${new Date(expiration).toISOString()}`);
        
        // Store tokens in SecureStore
        storeTokens(idToken, expiration, refreshToken);
        
        // Store basic user data in AsyncStorage (non-sensitive)
        const userData = {
          username: username,
          email: result.getIdToken().payload.email || username,
          sub: result.getIdToken().payload.sub
        };
        console.log(`Storing user data: ${JSON.stringify(userData)}`);
        storeUserData(userData);
        
        resolve(result);
      },
      onFailure: (err) => {
        console.error('Authentication failed:', err);
        reject(err);
      },
      // Add MFA support if ever needed
      mfaRequired: (challengeName, challengeParameters) => {
        console.log('MFA required during authentication');
        // This would need to be handled in the UI
        reject(new Error('MFA is required but not supported in this version'));
      }
    });
  });
};

/**
 * Sign out the current user and clear stored tokens and data
 */
export const signOut = async () => {
  try {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    
    // Clear stored tokens and data from both storage types
    await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(AUTH_STATE_KEY);
    
    console.log('User signed out, all auth data cleared');
  } catch (error) {
    console.error('Error signing out:', error);
    // Still clear local storage even if Cognito has an issue
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
    } catch (e) {
      console.error('Error clearing auth data during sign out:', e);
    }
  }
};

/**
 * Sign up a new user
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Sign up result
 */
export const signUp = (username, password, email) => {
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, [
      { Name: 'email', Value: email }
    ], null, (err, result) => {
      if (err) {
        console.error('Error during sign up:', err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Confirm a user's sign up with their verification code
 * @param {string} username - User's username or email
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Confirmation result
 */
export const confirmSignUp = (username, code) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('Error during confirmation:', err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Resend confirmation code to user's email
 * @param {string} username - User's username or email
 * @returns {Promise<string>} - Success message
 */
export const resendConfirmationCode = (username) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        console.error('Error resending code:', err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};
