import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OfflineScreen = () => {
  const { checkConnection, isCheckingConnection } = useNetwork();
  const [reconnectFailed, setReconnectFailed] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  // Reset the failure message after 5 seconds
  useEffect(() => {
    let timer;
    if (reconnectFailed) {
      timer = setTimeout(() => {
        setReconnectFailed(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [reconnectFailed]);

  const handleReconnect = async () => {
    setLastAttemptTime(new Date());
    const result = await checkConnection();
    // If we're still not connected after checking, show the failure message
    if (!result) {
      setReconnectFailed(true);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="wifi-off" size={80} color="#FF5722" style={styles.icon} />
      
      <Text style={styles.title}>No Internet Connection</Text>
      
      <Text style={styles.message}>
        TensorTours requires an internet connection to function properly.
      </Text>
      
      <Text style={styles.details}>
        Our app uses real-time data to provide you with audio tours, maps, and points of interest.
        All features of the app require connectivity to work.
      </Text>
      
      {reconnectFailed && (
        <Text style={styles.errorMessage}>
          Unable to connect. Please check your internet connection and try again.
        </Text>
      )}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleReconnect}
        disabled={isCheckingConnection}
      >
        {isCheckingConnection ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Checking...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Reconnect</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FF5722',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  details: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#777',
    lineHeight: 24,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#e53935',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default OfflineScreen;
