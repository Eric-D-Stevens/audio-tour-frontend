import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioPlayer from '../components/AudioPlayer';
import { fetchAudioTour } from '../services/api';

const AudioScreen = ({ route, navigation }) => {
  const { place } = route.params || {};
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState(null);
  
  // Fetch audio tour data including photos
  useEffect(() => {
    const fetchData = async () => {
      if (!place || !place.place_id) {
        setError('Invalid place data. Please try again.');
        return;
      }

      try {
        setLoading(true);
        const response = await fetchAudioTour(place.place_id, place.tourType || 'history');
        setPhotos(response.photos || []);
      } catch (error) {
        console.error('Error fetching audio tour:', error);
        setError('Failed to load audio tour data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{place.name}</Text>
        </View>
        
        {photos && photos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageSlider}
              onScroll={(event) => {
                const slideSize = event.nativeEvent.layoutMeasurement.width;
                const offset = event.nativeEvent.contentOffset.x;
                const index = Math.floor(offset / slideSize);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={200}
            >
              {photos.map((photoUrl, index) => (
                <View key={index} style={styles.imageSlide}>
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.placeImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />

                </View>
              ))}
            </ScrollView>
            <View style={styles.paginationDots}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[styles.paginationDot, index === currentImageIndex && styles.paginationDotActive]}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            {loading ? (
              <View style={styles.styledLoadingContainer}>
                <ActivityIndicator size="large" color="#FF5722" />
                <Text style={styles.styledLoadingText}>Generating AI-powered tour...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="image-outline" size={50} color="#999" />
                <Text style={styles.imagePlaceholderText}>No Image Available</Text>
              </>
            )}
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.tourTitle}>{place.name}</Text>
          <Text style={styles.tourDescription}>{place.vicinity || place.description || 'Explore this fascinating location with our AI-powered audio guide.'}</Text>
          
          <View style={styles.audioPlayerContainer}>
            <AudioPlayer 
              placeId={place.place_id} 
              tourType={place.tourType || 'history'} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  styledLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 12,
    minHeight: 200,
  },
  styledLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
    fontWeight: '500',
  },
  imageSlider: {
    height: 250,
    width: '100%',
  },
  imageSlide: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
  },
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
