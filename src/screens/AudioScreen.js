import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioPlayer from '../components/AudioPlayer';
import { getTour, getOnDemandTour } from '../services/api';
import { AuthContext, TourContext } from '../contexts';

const AudioScreen = ({ route, navigation }) => {
  const { place } = route.params || {};
  const { tourParams } = useContext(TourContext);
  const [tourData, setTourData] = useState(null);
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
        // If not available, fall back to the tour type from TourContext
        const tourType = place.tourType || tourParams.category;
        
        if (!tourType) {
          setError('Tour type is required. Please configure tour settings.');
          setLoading(false);
          return;
        }
        
        console.log(`Using tour type: ${tourType} for place: ${place.place_id}`);
        try {
          // TEMPORARY: Force error to test on-demand tour generation
          throw new Error('Forced error to test on-demand tour generation');
          
          // First, try to get a pre-generated tour
          const response = await getTour(place.place_id, tourType);
          setTourData(response.tour || null);
          
          // Extract photo URLs from tour data
          const photoUrls = response.tour?.photos?.map(photo => photo.cloudfront_url) || [];
          setPhotos(photoUrls);
        } catch (tourError) {
          console.log('Pre-generated tour not found, generating on-demand:', tourError.message);
          
          // Set a temporary loading message
          setError('Generating tour on-demand...');
          
          try {
            // Fallback to generating a tour on demand
            const onDemandResponse = await getOnDemandTour(place.place_id, tourType);
            setTourData(onDemandResponse.tour || null);
            
            // Extract photo URLs from the on-demand tour data
            const photoUrls = onDemandResponse.tour?.photos?.map(photo => photo.cloudfront_url) || [];
            setPhotos(photoUrls);
            
            // Clear any error messages
            setError(null);
          } catch (onDemandError) {
            console.error('Failed to generate on-demand tour:', onDemandError);
            throw new Error(`Unable to generate tour: ${onDemandError.message}`);
          }
        }
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
          {/* Place Information Section */}
          <Text style={styles.tourTitle}>{tourData?.place_info?.place_name || place.name}</Text>
          
          {/* Address */}
          {tourData?.place_info?.place_address && (
            <View style={styles.infoSection}>
              <Ionicons name="location-outline" size={18} color="#555" style={styles.infoIcon} />
              <Text style={styles.addressText}>{tourData.place_info.place_address}</Text>
            </View>
          )}
          
          {/* Editorial Description with Title */}
          {tourData?.place_info?.place_editorial_summary && tourData.place_info.place_editorial_summary.length > 0 ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About This Location</Text>
              <Text style={styles.tourDescription}>{tourData.place_info.place_editorial_summary}</Text>
            </View>
          ) : place.vicinity || place.description ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Location Details</Text>
              <Text style={styles.tourDescription}>{place.vicinity || place.description}</Text>
            </View>
          ) : null}
          
          <View style={styles.audioPlayerContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>Loading audio tour...</Text>
              </View>
            ) : tourData?.audio?.cloudfront_url ? (
              <AudioPlayer 
                placeId={place.place_id} 
                audioUrl={tourData.audio.cloudfront_url} 
                placeName={tourData?.place_info?.place_name || place.name}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Audio not available for this location.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // New styles for place information
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  infoIcon: {
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  descriptionContainer: {
    marginBottom: 15,
    paddingVertical: 5,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    minHeight: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
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
    padding: 15,
  },
  tourTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  tourDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
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
