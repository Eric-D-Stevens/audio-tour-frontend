import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import logger from '../utils/logger';

/**
 * Request tracking permission - call this and await it before other initialization
 * Returns the tracking status
 */
export const requestTrackingPermission = async () => {
  if (Platform.OS !== 'ios') {
    return 'not-applicable';
  }
  
  try {
    const { status } = await requestTrackingPermissionsAsync();
    logger.info('Tracking permission result:', status);
    return status;
  } catch (error) {
    logger.error('Error requesting tracking permission:', error);
    return 'error';
  }
};

const TrackingContext = createContext();

export const TrackingProvider = ({ children, initialStatus }) => {
  // Status is passed in from App.js after awaiting the permission request
  const [trackingStatus] = useState(initialStatus);

  const value = {
    trackingStatus,
    isLoading: false, // Always false since we await before rendering
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

export default TrackingContext;
