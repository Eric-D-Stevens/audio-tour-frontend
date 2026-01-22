import React from 'react';
import { View, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts';

/**
 * PhotoAttribution Component
 * 
 * This component displays the required Google attribution for photos
 * with Google logo and author information as required by Google's policy.
 * If attributionUri is provided, the author name becomes clickable and links to that URI.
 */
const PhotoAttribution = ({ attributionName, attributionUri }) => {
  const { colors, isDark } = useTheme();
  
  const openGoogleTerms = () => {
    Linking.openURL('https://cloud.google.com/maps-platform/terms/');
  };
  
  const openAttributionLink = () => {
    if (attributionUri) {
      Linking.openURL(attributionUri);
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(250, 250, 250, 0.95)',
    },
    imageFromText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginRight: 4,
      fontWeight: '400',
    },
    attributionText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    attributionLink: {
      color: colors.primary,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Google logo on the bottom left */}
      <TouchableOpacity 
        style={styles.googleLogoContainer} 
        onPress={openGoogleTerms}
        activeOpacity={0.7}
      >
        <Text style={dynamicStyles.imageFromText}>Image from </Text>
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
              <Text style={[dynamicStyles.attributionText, dynamicStyles.attributionLink]}>
                Photo by {attributionName}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={dynamicStyles.attributionText}>
              Photo by {attributionName}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  googleLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 50,
    height: 16,
  },
  attributionContainer: {
    justifyContent: 'center',
    flexShrink: 1,
    marginLeft: 8,
  },
});

export default PhotoAttribution;
