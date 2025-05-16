import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoRefreshToken, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from '../constants/config';
import logger from '../utils/logger';

// Constants for storage keys
const AUTH_TOKENS_KEY = 'tensortours_auth_tokens'; // Secure storage
const REFRESH_TOKEN_KEY = 'tensortours_refresh_token'; // Secure storage
const REFRESH_USERNAME_KEY = 'tensortours_refresh_username'; // Secure storage
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
    // First try to get token from SecureStore
    const authData = await SecureStore.getItemAsync(AUTH_TOKENS_KEY);
    
    if (authData) {
      const { idToken, expiration } = JSON.parse(authData);
      
      // Check if token is still valid based on expiration time
      const now = Date.now();
      // Add a 5-minute buffer to ensure we refresh before actual expiration
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (expiration > now + bufferTime) {
        return { token: idToken, error: null }; // Return stored token if not expired
      }
      
      // If token is expired or expiring soon, try to refresh it
      const refreshResult = await refreshTokenIfNeeded();
      if (refreshResult.token) {
        return { token: refreshResult.token, error: null };
      }
      
      // If refresh fails with a specific reason, return it
      return { token: null, error: refreshResult.error || 'Token refresh failed' };
    }
    
    // If we don't have any stored tokens, check for a current session
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      // This is an expected condition, not an error
      return { token: null, error: null };
    }
    
    // Get session from current Cognito user
    return new Promise((resolve) => {
      cognitoUser.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          resolve({ 
            token: null, 
            error: err ? err.message || 'Session invalid' : 'Session invalid' 
          });
          return;
        }
        
        // Get the token and store it with expiration time
        const idToken = session.getIdToken().getJwtToken();
        const expiration = session.getIdToken().getExpiration() * 1000; // Convert to milliseconds
        const refreshToken = session.getRefreshToken().getToken();
        
        // Store the tokens for future use
        storeTokens(idToken, expiration, refreshToken);
        
        resolve({ token: idToken, error: null });
      });
    });
  } catch (error) {
    // Silent error handling to reduce console noise
    return { token: null, error: error.message || 'Unknown auth error' };
  }
};

/**
 * Store authentication tokens in SecureStore for better security
 * @param {string} idToken - ID token from Cognito
 * @param {number} expiration - Expiration timestamp in milliseconds
 * @param {string} refreshToken - Refresh token for obtaining new tokens
 * @param {boolean} scheduleRefresh - Whether to schedule a refresh for this token
 */
const storeTokens = async (idToken, expiration, refreshToken, scheduleRefresh = true) => {
  try {
    logger.debug('Storing tokens', { 
      hasIdToken: !!idToken, 
      expiresIn: Math.round((expiration - Date.now()) / 1000) + 's',
      hasRefreshToken: !!refreshToken
    });
    
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
      
      // Also store username in SecureStore to help with refresh token usage
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        await SecureStore.setItemAsync(REFRESH_USERNAME_KEY, cognitoUser.getUsername());
        logger.debug('Stored username for refresh token recovery');
      }
    }
    
    // Also update the auth state in AsyncStorage for quick checks
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
      isAuthenticated: true,
      lastAuthenticated: new Date().toISOString(),
      tokenExpiration: new Date(expiration).toISOString()
    }));
    
    logger.debug('Tokens stored securely');
    
    // Schedule a background refresh if requested
    if (scheduleRefresh && refreshToken) {
      scheduleTokenRefresh(expiration, refreshToken);
    }
  } catch (error) {
    logger.error('Error storing tokens:', error);
  }
};

/**
 * Schedule a background token refresh before the token expires
 * @param {number} expiration - Token expiration timestamp in milliseconds
 * @param {string} refreshToken - Refresh token to use
 */
const scheduleTokenRefresh = (expiration, refreshToken) => {
  if (!refreshToken) return;
  
  // Calculate time until refresh (5 minutes before expiration)
  const now = Date.now();
  const refreshTime = expiration - now - (5 * 60 * 1000); // 5 minutes before expiration
  
  // Only schedule if the refresh time is positive (token not already expired)
  if (refreshTime <= 0) {
    logger.debug('Token already expired or expiring soon, refreshing immediately');
    refreshTokenIfNeeded();
    return;
  }
  
  logger.debug(`Scheduling token refresh in ${Math.floor(refreshTime/1000)} seconds`);
  
  // Use setTimeout to schedule the refresh
  setTimeout(async () => {
    try {
      logger.debug('Executing scheduled token refresh');
      const result = await refreshTokenIfNeeded();
      if (result && result.token) {
        logger.debug('Token refreshed successfully in background');
      } else {
        logger.warn('Background token refresh failed, will retry on next app use');
      }
    } catch (error) {
      logger.error('Error in scheduled token refresh:', error);
    }
  }, refreshTime);
};

/**
 * Clean up invalid authentication data
 * This is called when a refresh token is invalid to ensure we don't keep trying with bad data
 */
export const cleanupInvalidAuth = async () => {
  try {
    logger.debug('Cleaning up invalid auth data');
    await SecureStore.deleteItemAsync(AUTH_TOKENS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_USERNAME_KEY);
    await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
      isAuthenticated: false,
      lastAuthenticated: null,
      tokenExpiration: null
    }));
    logger.debug('Cleaned up invalid authentication data');
  } catch (error) {
    logger.error('Error cleaning up invalid auth data:', error);
  }
};

/**
 * Try to refresh the token if it's expired but the refresh token is still valid
 * @param {boolean} [forceRefresh=false] - Force a refresh regardless of token expiration
 * @returns {Promise<{token: string|null, error: string|null}>} - New ID token or null with error if refresh failed
 */
export const refreshTokenIfNeeded = async (forceRefresh = false) => {
  try {
    logger.debug('Token refresh attempt initiated');
    
    // First try using stored refresh token from SecureStore
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const storedUsername = await SecureStore.getItemAsync(REFRESH_USERNAME_KEY);
    
    logger.debug('Refresh token available:', { 
      hasRefreshToken: !!storedRefreshToken,
      hasUsername: !!storedUsername 
    });
    
    let cognitoUser = userPool.getCurrentUser();
    
    // If we have a stored refresh token but no current user, try to recreate the user
    if (!cognitoUser && storedRefreshToken && storedUsername) {
      logger.debug('No current user but we have refresh token and username - recreating user');
      cognitoUser = new CognitoUser({
        Username: storedUsername,
        Pool: userPool
      });
    }
    
    if (!cognitoUser) {
      // This is normal for first login or after logout
      logger.debug('No Cognito user available for refresh');
      return { token: null, error: null };
    }
    
    logger.debug(`Attempting token refresh for user: ${cognitoUser.getUsername()}`);
    
    return new Promise((resolve) => {
      cognitoUser.getSession(async (err, session) => {
        if (err) {
          // If we have a stored refresh token, try using it directly
          if (storedRefreshToken) {
            try {
              const refreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
              
              cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
                if (refreshErr) {
                  // Clean up invalid tokens when refresh fails
                  logger.error('Refresh token error:', { 
                    code: refreshErr.code,
                    name: refreshErr.name,
                    message: refreshErr.message 
                  });
                  cleanupInvalidAuth();
                  resolve({ token: null, error: 'Refresh token expired' });
                  return;
                }
                
                // Get the new token and store it
                const newIdToken = refreshedSession.getIdToken().getJwtToken();
                const newExpiration = refreshedSession.getIdToken().getExpiration() * 1000;
                const newRefreshToken = refreshedSession.getRefreshToken().getToken();
                
                storeTokens(newIdToken, newExpiration, newRefreshToken);
                resolve({ token: newIdToken, error: null });
              });
            } catch (e) {
              // Clean up invalid tokens on exception
              cleanupInvalidAuth();
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
            logger.debug('No session refresh token, trying stored token');
            try {
              const storedToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
              cognitoUser.refreshSession(storedToken, (refreshErr, refreshedSession) => {
                if (refreshErr) {
                  logger.error('Error refreshing with stored token:', refreshErr);
                  resolve({ token: null, error: 'All refresh tokens expired' });
                  return;
                }
                
                handleRefreshedSession(refreshedSession, resolve, true); // true to schedule next refresh
              });
            } catch (e) {
              resolve({ token: null, error: 'Invalid refresh token format' });
            }
          } else {
            cleanupInvalidAuth();
            resolve({ token: null, error: 'No refresh token available' });
          }
          return;
        }
        
        // Try to refresh the session with the session refresh token
        cognitoUser.refreshSession(refreshToken, (refreshErr, refreshedSession) => {
          if (refreshErr) {
            cleanupInvalidAuth();
            resolve({ token: null, error: refreshErr.message || 'Refresh failed' });
            return;
          }
          
          handleRefreshedSession(refreshedSession, resolve);
        });
      });
    });
  } catch (error) {
    cleanupInvalidAuth();
    return { token: null, error: error.message || 'Unexpected refresh error' };
  }
};

// Helper function for handling a refreshed session
const handleRefreshedSession = (refreshedSession, resolve, scheduleRefresh = false) => {
  // Get the new token and store it
  const newIdToken = refreshedSession.getIdToken().getJwtToken();
  const newExpiration = refreshedSession.getIdToken().getExpiration() * 1000;
  const newRefreshToken = refreshedSession.getRefreshToken().getToken();
  
  logger.debug('Successfully refreshed session', {
    expiresIn: Math.round((newExpiration - Date.now()) / 1000) + 's'
  });
  
  storeTokens(newIdToken, newExpiration, newRefreshToken, scheduleRefresh);
  
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
    logger.error('Error getting user data:', error);
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
    logger.error('Error storing user data:', error);
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
  try {
    // First check from local storage state for quick response
    const authState = await AsyncStorage.getItem(AUTH_STATE_KEY);
    const tokenResult = await getAuthToken(); // This will handle refresh if needed
    
    if (tokenResult.token) {
      return { isAuthenticated: true, error: null };
    } else {
      // Token refresh failures are expected and shouldn't produce warnings
      if (tokenResult.error && tokenResult.error.includes('Token refresh failed')) {
        // Silent handling of expected token refresh failures
        return { isAuthenticated: false, error: null };
      }
      
      // Only log actual unexpected errors
      return { isAuthenticated: false, error: tokenResult.error };
    }
  } catch (error) {
    logger.error('Error checking auth status:', error);
    return { isAuthenticated: false, error: error.message };
  }
};

/**
 * Sign in a user and store their tokens and data securely
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Authentication result
 */
export const signIn = async (username, password) => {
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
        // Store tokens securely
        const idToken = result.getIdToken().getJwtToken();
        const expiration = result.getIdToken().getExpiration() * 1000;
        const refreshToken = result.getRefreshToken().getToken();
        
        // Store tokens in SecureStore
        storeTokens(idToken, expiration, refreshToken);
        
        // Store basic user data in AsyncStorage (non-sensitive)
        const userData = {
          username: username,
          email: result.getIdToken().payload.email || username,
          sub: result.getIdToken().payload.sub
        };
        storeUserData(userData);
        

        
        resolve(result);
      },
      onFailure: (err) => {
        // Handle unverified user accounts - this enables a better UX flow
        if (err.code === 'UserNotConfirmedException') {
          // Return special error object with flag indicating an unverified account
          reject({
            code: 'UserNotConfirmedException',
            message: 'Account is not verified. Please check your email for verification code.',
            username: username,
            unverifiedAccount: true
          });
        } else {
          reject(err);
        }
      },
      // Add MFA support if ever needed
      mfaRequired: (challengeName, challengeParameters) => {
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

    // Sign out of Cognito
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    
    // Clean up all storage items to fully log out the user
    const itemsToRemove = [
      SecureStore.deleteItemAsync(AUTH_TOKENS_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
      AsyncStorage.removeItem(AUTH_STATE_KEY)
    ];
    
    await Promise.all(itemsToRemove);
    logger.info('User signed out, auth data cleared');
  } catch (error) {
    logger.error('Error signing out:', error);
    // Still try to clear tokens even if there was an error
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKENS_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
        AsyncStorage.removeItem(AUTH_STATE_KEY)
      ]);
    } catch (e) {
      logger.error('Error clearing auth data during sign out:', e);
    }
  }
};
/**
 * Sign up a new user
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @param {string} email - User's email
 * @param {string} policyVersion - Version of the privacy policy agreed to
 * @param {string} consentTimestamp - ISO timestamp when user agreed to policy
 * @returns {Promise<Object>} - Sign up result
 */
export const signUp = (username, password, email, policyVersion = '1.0', consentTimestamp = new Date().toISOString()) => {
  return new Promise((resolve, reject) => {
    // Create attributes array with email and privacy policy consent data
    const attributeList = [
      { Name: 'email', Value: email },
      { Name: 'custom:policyVersion', Value: policyVersion },
      { Name: 'custom:consentDate', Value: consentTimestamp }
    ];
    
    userPool.signUp(username, password, attributeList, null, (err, result) => {
      if (err) {
        logger.error('Error during sign up:', err);
        reject(err);
        return;
      }
      
      // Also store consent data in AsyncStorage for local reference
      try {
        AsyncStorage.setItem('tensortrix_privacy_consent', JSON.stringify({
          version: policyVersion,
          timestamp: consentTimestamp,
          username: username
        }));
      } catch (storageError) {
        logger.warn('Failed to store privacy consent locally:', storageError);
        // Continue anyway as we've stored it in Cognito
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
        logger.error('Error during confirmation:', err);
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
        logger.error('Error resending code:', err);
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

/**
 * Initiate forgot password flow
 * @param {string} username - User's username or email
 * @returns {Promise<string>} - Success message
 */
export const forgotPassword = (username) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.forgotPassword({
      onSuccess: (result) => {
        logger.info('Password reset code sent successfully');
        resolve(result);
      },
      onFailure: (err) => {
        logger.error('Error sending password reset code:', err);
        reject(err);
      }
    });
  });
};

/**
 * Confirm new password with verification code
 * @param {string} username - User's username or email
 * @param {string} code - Verification code sent to user's email
 * @param {string} newPassword - New password
 * @returns {Promise<string>} - Success message
 */
export const confirmNewPassword = async (username, code, newPassword) => {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: username,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        logger.info('Password reset successful');
        resolve('Password reset successful');
      },
      onFailure: (err) => {
        logger.error('Password reset failed:', err);
        reject(err);
      }
    });
  });
};

/**
 * Delete the current user's account
 * @returns {Promise<string>} - Success message or error
 */
export const deleteAccount = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get the current authenticated Cognito user
      const cognitoUser = userPool.getCurrentUser();
      
      if (!cognitoUser) {
        logger.error('No authenticated user found for account deletion');
        return reject('Not authenticated');
      }
      
      // Get session to authenticate the delete request
      cognitoUser.getSession((err, session) => {
        if (err) {
          logger.error('Error getting session for account deletion:', err);
          return reject(err);
        }
        
        // Delete the user account
        cognitoUser.deleteUser((err, result) => {
          if (err) {
            logger.error('Failed to delete user account:', err);
            return reject(err);
          }
          
          logger.info('User account successfully deleted');
          
          // Clean up local storage
          Promise.all([
            SecureStore.deleteItemAsync(AUTH_TOKENS_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            AsyncStorage.removeItem(USER_DATA_KEY),
            AsyncStorage.removeItem(AUTH_STATE_KEY)
          ])
          .then(() => {
            logger.info('Local user data cleared after account deletion');
            resolve('Account successfully deleted');
          })
          .catch((e) => {
            logger.error('Error clearing local data after account deletion:', e);
            // Still resolve since the account was deleted on Cognito
            resolve('Account deleted, but there was an error clearing local data');
          });
        });
      });
    } catch (e) {
      logger.error('Unexpected error during account deletion:', e);
      reject(e);
    }
  });
};
