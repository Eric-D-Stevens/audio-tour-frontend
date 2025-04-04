import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from '../constants/config';

// Constants for storage keys
const AUTH_TOKENS_KEY = 'tensortours_auth_tokens';
const USER_DATA_KEY = 'tensortours_user_data';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID
});

/**
 * Get the current authentication token, prioritizing locally stored tokens
 * @returns {Promise<string|null>} - Authentication token or null if not authenticated
 */
export const getAuthToken = async () => {
  try {
    console.log('Getting auth token...');
    // First try to get token from AsyncStorage
    const authData = await AsyncStorage.getItem(AUTH_TOKENS_KEY);
    
    if (authData) {
      console.log('Found stored auth data');
      const { idToken, expiration } = JSON.parse(authData);
      
      // Check if token is still valid based on expiration time
      const now = Date.now();
      console.log(`Token expiration check: expires at ${new Date(expiration).toISOString()}, now is ${new Date(now).toISOString()}`);
      
      if (expiration > now) {
        console.log('Using stored token - still valid');
        return idToken; // Return stored token if not expired
      } else {
        console.log('Stored token is expired, attempting refresh');
      }
      
      // If token is expired, try to refresh it
      const refreshedToken = await refreshTokenIfNeeded();
      if (refreshedToken) {
        console.log('Successfully refreshed token');
        return refreshedToken;
      } else {
        console.log('Token refresh failed');
      }
    } else {
      console.log('No stored auth data found');
    }
    
    // If no stored token or refresh failed, fall back to Cognito session check
    console.log('Falling back to Cognito session check');
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      console.log('No current Cognito user found');
      return null;
    }
    
    console.log(`Current Cognito user found: ${cognitoUser.getUsername()}`);
    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          console.error('Session error or invalid:', err);
          resolve(null);
          return;
        }
        
        console.log('Valid Cognito session found');
        // Get the token and store it with expiration time
        const idToken = session.getIdToken().getJwtToken();
        const expiration = session.getIdToken().getExpiration() * 1000; // Convert to milliseconds
        
        console.log(`New token obtained from Cognito, expires: ${new Date(expiration).toISOString()}`);
        // Store the tokens for future use
        storeTokens(idToken, expiration);
        
        resolve(idToken);
      });
    });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Store authentication tokens in AsyncStorage
 * @param {string} idToken - ID token from Cognito
 * @param {number} expiration - Expiration timestamp in milliseconds
 */
const storeTokens = async (idToken, expiration) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify({
      idToken,
      expiration
    }));
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

/**
 * Try to refresh the token if it's expired but the refresh token is still valid
 * @returns {Promise<string|null>} - New ID token or null if refresh failed
 */
const refreshTokenIfNeeded = async () => {
  try {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      return null;
    }
    
    return new Promise((resolve) => {
      cognitoUser.getSession((err, session) => {
        if (err) {
          console.error('Error getting session for refresh:', err);
          resolve(null);
          return;
        }
        
        if (!session) {
          resolve(null);
          return;
        }
        
        // Check if we have a refresh token
        const refreshToken = session.getRefreshToken();
        if (!refreshToken) {
          resolve(null);
          return;
        }
        
        // Try to refresh the session
        cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
          if (refreshErr) {
            console.error('Error refreshing session:', refreshErr);
            resolve(null);
            return;
          }
          
          // Get the new token and store it
          const newIdToken = refreshedSession.getIdToken().getJwtToken();
          const newExpiration = refreshedSession.getIdToken().getExpiration() * 1000;
          
          storeTokens(newIdToken, newExpiration);
          console.log('Token refreshed successfully');
          
          resolve(newIdToken);
        });
      });
    });
  } catch (error) {
    console.error('Error in refreshTokenIfNeeded:', error);
    return null;
  }
};

/**
 * Get the current authenticated user data from local storage
 * @returns {Promise<Object|null>} - User data or null if not available
 */
export const getCurrentUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
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
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Sign in a user and store their tokens and data
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
        // Store tokens
        const idToken = result.getIdToken().getJwtToken();
        const expiration = result.getIdToken().getExpiration() * 1000;
        console.log(`Token obtained, expires: ${new Date(expiration).toISOString()}`);
        console.log(`Token type: ${typeof idToken}, length: ${idToken.length}`);
        
        // Store tokens in AsyncStorage
        storeTokens(idToken, expiration);
        
        // Store basic user data
        const userData = {
          username: username,
          email: result.getIdToken().payload.email || username
        };
        console.log(`Storing user data: ${JSON.stringify(userData)}`);
        storeUserData(userData);
        
        resolve(result);
      },
      onFailure: (err) => {
        console.error('Authentication failed:', err);
        reject(err);
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
    
    // Clear stored tokens and data
    await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error signing out:', error);
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
