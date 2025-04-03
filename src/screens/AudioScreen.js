import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioPlayer from '../components/AudioPlayer';

const AudioScreen = ({ route, navigation }) => {
  const { place } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Check if we have valid place data
  useEffect(() => {
    if (!place || !place.place_id) {
      setError('Invalid place data. Please try again.');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [place]);
  
  // If there's an error, show error screen
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audio Tour</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.backToMapButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToMapButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If still loading initial data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generating Tour...</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.errorText}>Generating AI-powered tour from scratch, this may take a few seconds...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{place.name}</Text>
        </View>
        
        {place.photos && place.photos[0] ? (
          <View>
            <Image 
              source={{ uri: place.photos[0] }}
              style={styles.placeImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={50} color="#999" />
            <Text style={styles.imagePlaceholderText}>No Image Available</Text>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.tourTitle}>{place.name}</Text>
          <Text style={styles.tourDescription}>{place.vicinity || place.description || 'Explore this fascinating location with our AI-powered audio guide.'}</Text>
          
          <View style={styles.audioPlayerContainer}>
            <AudioPlayer 
              placeId={place.place_id} 
              tourType={place.tour_type || 'history'} 
            />
          </View>
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
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  placeImage: {
    height: 250,
    width: '100%',
    resizeMode: 'cover',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  tourTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tourDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  audioPlayerContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  backToMapButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  backToMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});


export default AudioScreen;
