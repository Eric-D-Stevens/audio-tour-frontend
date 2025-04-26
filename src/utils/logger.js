/**
 * TensorTours Logging Utility
 * 
 * This utility provides logging functionality that is automatically disabled
 * in production environments to comply with App Store requirements.
 */

import Constants from 'expo-constants';

// Set this to true to simulate production mode for testing
let simulateProduction = false;

// Determine if we're in development or production
const isDevelopment = 
  !simulateProduction && 
  !Constants.expoConfig?.extra?.isProduction && 
  process.env.NODE_ENV !== 'production';

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Custom logger that only logs in development environments
 */
const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args) => {
    // We allow error logs in production for critical errors
    // but you can disable this too by wrapping in isDevelopment check
    console.error('[ERROR]', ...args);
  },
  
  // Special method that always logs regardless of environment
  // Use this sparingly for truly critical information
  critical: (...args) => {
    console.error('[CRITICAL]', ...args);
  }
};

export default logger;
