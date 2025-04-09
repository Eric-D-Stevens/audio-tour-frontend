import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestAudioPlayer from '../components/GuestAudioPlayer';
import { fetchPreviewAudioTour } from '../services/api';
import { TourContext } from '../../App';

const GuestAudioScreen = ({ route, navigation }) => {
  const { place } = route.params || {};
  const { guestTourParams } = useContext(TourContext);
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
        // First try to use the tour type passed directly with the place object
        // If not available, fall back to the tour type from guestTourParams
        const tourType = place.tourType || guestTourParams?.category || 'history';
        
        console.log(`Using tour type: ${tourType} for place: ${place.name}`);
        
        // For guest mode, we use the preview audio endpoint
        const response = await fetchPreviewAudioTour(place.place_id, tourType);
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
            <GuestAudioPlayer 
              placeId={place.place_id} 
              tourType={place.tourType || 'history'}
            />
          </View>
          
          <View style={styles.guestModeNotice}>
            <Ionicons name="information-circle-outline" size={24} color="#FF5722" />
            <Text style={styles.guestModeText}>
              You're in guest mode. Sign up for a full account to access personalized tours and more features.
            </Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  contentContainer: {
    padding: 20,
  },
  tourTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tourDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  audioPlayerContainer: {
    marginVertical: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backToMapButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToMapButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  guestModeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  guestModeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  }
});

export default GuestAudioScreen;
