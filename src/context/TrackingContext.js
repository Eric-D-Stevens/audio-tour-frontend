import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import logger from '../utils/logger';

const TrackingContext = createContext();

export const TrackingProvider = ({ children }) => {
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    requestTrackingOnLaunch();
  }, []);

  const requestTrackingOnLaunch = async () => {
    try {
      // Only relevant on iOS
      if (Platform.OS !== 'ios') {
        setIsLoading(false);
        return;
      }

      // Check current status first
      const { status: currentStatus } = await getTrackingPermissionsAsync();
      
      // If already determined, just set the status
      if (currentStatus !== 'undetermined') {
        setTrackingStatus(currentStatus);
        setIsLoading(false);
        logger.debug('Tracking already determined:', currentStatus);
        return;
      }

      // Request permission - shows iOS system dialog
      const { status } = await requestTrackingPermissionsAsync();
      setTrackingStatus(status);
      logger.info('Tracking permission result:', status);
    } catch (error) {
      logger.error('Error requesting tracking permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    trackingStatus,
    isLoading,
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
