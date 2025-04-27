import React from 'react';
import { View, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';

/**
 * PhotoAttribution Component
 * 
 * This component displays the required Google attribution for photos
 * with Google logo and author information as required by Google's policy.
 * If attributionUri is provided, the author name becomes clickable and links to that URI.
 */
const PhotoAttribution = ({ attributionName, attributionUri }) => {
  const openGoogleTerms = () => {
    Linking.openURL('https://cloud.google.com/maps-platform/terms/');
  };
  
  const openAttributionLink = () => {
    if (attributionUri) {
      Linking.openURL(attributionUri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Google logo on the bottom left */}
      <TouchableOpacity 
        style={styles.googleLogoContainer} 
        onPress={openGoogleTerms}
        activeOpacity={0.7}
      >
        <Text style={styles.imageFromText}>Image from </Text>
        <Image 
          source={require('../../assets/google_logo.png')} 
          style={styles.googleLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Photo attribution on the bottom right */}
      {attributionName && (
        <View style={styles.attributionContainer}>
          {attributionUri ? (
            <TouchableOpacity onPress={openAttributionLink} activeOpacity={0.7}>
              <Text style={[styles.attributionText, styles.attributionLink]}>
                Photo By: {attributionName}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.attributionText}>
              Photo By: {attributionName}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  googleLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFromText: {
    fontSize: 12,
    color: '#555',
    marginRight: 4,
  },
  googleLogo: {
    width: 60,
    height: 20,
  },
  attributionContainer: {
    justifyContent: 'center',
  },
  attributionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '400',
  },
  attributionLink: {
    color: '#FF5722',  // Using TensorTours orange for links
    textDecorationLine: 'underline',
  }
});

export default PhotoAttribution;
