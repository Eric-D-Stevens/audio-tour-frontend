import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="About TensorTours" />
      <ScrollView style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/EarthAudio.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.heading}>About TensorTours</Text>
        
        <Text style={styles.paragraph}>
          TensorTours is a location-based audio tour application that helps you discover the hidden 
          stories and fascinating history around you, wherever you are.
        </Text>
        
        <Text style={styles.paragraph}>
          Using advanced location technology, TensorTours identifies points of interest near you and 
          provides engaging audio narratives about their significance, history, and interesting facts.
        </Text>
        
        <Text style={styles.subheading}>Our Mission</Text>
        
        <Text style={styles.paragraph}>
          Our mission is to make history, culture, and knowledge accessible to everyone through 
          immersive audio experiences. We believe that every place has a story to tell, and we're 
          dedicated to bringing those stories to life.
        </Text>
        
        <Text style={styles.subheading}>How It Works</Text>
        
        <Text style={styles.paragraph}>
          Simply open the app, allow location access, and TensorTours will identify interesting 
          locations around you. Select a point on the map to hear a professionally narrated story 
          about that location. You can customize your experience by adjusting the search radius, 
          number of attractions, and categories of interest.
        </Text>
        
        <Text style={styles.subheading}>Version</Text>
        <Text style={styles.paragraph}>TensorTours v1.0.0</Text>
        
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2025 TensorTours. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
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
