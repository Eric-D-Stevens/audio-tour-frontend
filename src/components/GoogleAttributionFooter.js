import React from 'react';
import { View, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';

/**
 * GoogleAttributionFooter Component
 * 
 * This component provides the required Google Maps/Places attribution for the app.
 * It should be included at the bottom of screens that use Google Maps or Places data.
 */
const GoogleAttributionFooter = () => {
  const openGoogleTerms = () => {
    Linking.openURL('https://cloud.google.com/maps-platform/terms/');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.attributionContainer} 
        onPress={openGoogleTerms}
        activeOpacity={0.7}
      >
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image 
          source={require('../../assets/google_logo.png')} 
          style={styles.googleLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <Text style={styles.legalText}>
        ©{new Date().getFullYear()} Google - Map data ©{new Date().getFullYear()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attributionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  poweredByText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  googleLogo: {
    width: 60,
    height: 20,
  },
  legalText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  }
});

export default GoogleAttributionFooter;
