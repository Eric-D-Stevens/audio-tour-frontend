import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';

// Create the network context
export const NetworkContext = createContext(null);

// Provider component
export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Function to check connection status
  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const state = await NetInfo.fetch();
      logger.debug(`Network connection status: ${state.isConnected ? 'connected' : 'disconnected'}`);
      const isConnectedNow = !!state.isConnected;
      setIsConnected(isConnectedNow);
      return isConnectedNow; // Return success/failure status
    } catch (error) {
      logger.error('Error checking network connection:', error);
      setIsConnected(false);
      return false; // Return failure
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Set up a listener for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      logger.debug(`Network connection changed: ${state.isConnected ? 'connected' : 'disconnected'}`);
      setIsConnected(!!state.isConnected);
    });

    // Initial check
    checkConnection();

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isCheckingConnection, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};

// Custom hook to use the network context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
