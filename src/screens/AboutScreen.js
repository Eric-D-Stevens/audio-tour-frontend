import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts';

const AboutScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    heading: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 15 },
    subheading: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 20, marginBottom: 10 },
    paragraph: { fontSize: 16, lineHeight: 24, color: colors.textSecondary, marginBottom: 15 },
    copyright: { fontSize: 14, color: colors.textMuted },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <AppHeader navigation={navigation} title="About TensorTours" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={require('../../assets/EarthAudio.jpg')} 
          style={styles.logo}
          resizeMode="cover"
        />
        
        <View style={styles.content}>
          <Text style={dynamicStyles.heading}>About TensorTours</Text>
        
        <Text style={dynamicStyles.paragraph}>
          TensorTours is a location-based audio tour application that helps you discover the hidden 
          stories and fascinating history around you, wherever you are.
        </Text>
        
        <Text style={dynamicStyles.paragraph}>
          Powered by cutting-edge AI, TensorTours dynamically generates personalized tour content and 
          delivers it through natural-sounding voices. Our AI creates rich, informative narratives 
          about each location's history, architecture, and cultural significance in real-time.
        </Text>
        
        <Text style={dynamicStyles.subheading}>Our Mission</Text>
        
        <Text style={dynamicStyles.paragraph}>
          Our mission is to transform how we interact with the world around us. In an era where most of us 
          are constantly looking down at our screens, disconnected from our surroundings, TensorTours 
          flips the script—using the very device that often distracts us to actually deepen our connection 
          with the places we visit.
        </Text>
        
        <Text style={dynamicStyles.paragraph}>
          We believe technology should enhance our real-world experiences, not replace them. By delivering 
          rich, AI-generated audio content about the places around you, we encourage mindful exploration, 
          helping you look up from your screen and truly see the history, architecture, and culture that 
          surrounds you every day.
        </Text>
        
        <Text style={dynamicStyles.subheading}>How It Works</Text>
        
        <Text style={dynamicStyles.paragraph}>
          Simply open the app, allow location access, and TensorTours will identify interesting 
          locations around you. Select a point on the map to hear a professionally narrated story 
          about that location. You can customize your experience by adjusting the search radius, 
          number of attractions, and categories of interest.
        </Text>
        
        <Text style={dynamicStyles.subheading}>Version</Text>
        <Text style={dynamicStyles.paragraph}>TensorTours v1.0.0</Text>
        
        <View style={styles.footer}>
          <Text style={dynamicStyles.copyright}>© 2025 TensorTours. All rights reserved.</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  logo: {
    width: '100%',
    height: 220,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 15,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 15,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    color: '#777',
  },
});

export default AboutScreen;
