import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestAudioPlayer from '../components/GuestAudioPlayer';
import { fetchPreviewTour } from '../services/api';
import { TourContext } from '../contexts';

const GuestAudioScreen = ({ route, navigation }) => {
  const { place } = route.params || {};
  const { guestTourParams } = useContext(TourContext);
  const [tourData, setTourData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [scriptModalVisible, setScriptModalVisible] = useState(false);
  const [scriptText, setScriptText] = useState("");
  
  // Fetch audio tour data including photos
  // Function to open the script modal and fetch script content
  const openModal = async () => {
    try {
      setScriptModalVisible(true);
      
      if (tourData?.script?.cloudfront_url) {
        setScriptText("Loading script...");
        
        const response = await fetch(tourData.script.cloudfront_url);
        if (!response.ok) {
          throw new Error(`Failed to load script: ${response.status}`);
        }
        
        const text = await response.text();
        setScriptText(text);
      } else {
        setScriptText("Script not available for this tour.");
      }
    } catch (error) {
      console.error("Error loading script:", error);
      setScriptText(`Error loading script: ${error.message}`);
    }
  };

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
        
        console.log(`Using tour type: ${tourType} for place: ${place.place_id}`);
        
        // For guest mode, we use the preview tour endpoint
        const response = await fetchPreviewTour(place.place_id, tourType);
        console.log('Preview tour response:', JSON.stringify(response, null, 2));
        
        // Store the full tour data
        setTourData(response.tour || null);
        
        // Extract photos from the new response structure
        // Photos are now in response.tour.photos[].cloudfront_url
        if (response?.tour?.photos && Array.isArray(response.tour.photos)) {
          const photoUrls = response.tour.photos
            .filter(photo => photo?.cloudfront_url)
            .map(photo => photo.cloudfront_url);
          setPhotos(photoUrls);
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
          <Text style={styles.headerTitle}>{tourData?.place_info?.place_name || place?.name || "TensorTours"}</Text>
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
      {loading && (
        <View style={styles.loadingOverlay}>
          {/* Loading indicator with message */}
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="large" color="#FF5722" style={{transform: [{scale: 1.5}]}} />
            <Text style={styles.loadingText}>Loading Tour</Text>
          </View>
          
          {/* Semi-transparent content placeholders */}
          <View style={styles.skeletonContainer}>
            {/* Image placeholder */}
            <View style={styles.skeletonImageContainer}>
              <Ionicons name="image-outline" size={40} color="#ddd" />
            </View>
            
            {/* Title placeholder */}
            <View style={styles.skeletonTitleBar} />
            
            {/* Address placeholder */}
            <View style={styles.skeletonAddressContainer}>
              <View style={styles.skeletonAddressIcon} />
              <View style={styles.skeletonAddressBar} />
            </View>
            
            {/* Description placeholder */}
            <View style={styles.skeletonDescriptionContainer}>
              <View style={styles.skeletonDescriptionTitle} />
              <View style={styles.skeletonDescriptionLine} />
              <View style={styles.skeletonDescriptionLine} />
              <View style={[styles.skeletonDescriptionLine, { width: '70%' }]} />
            </View>
            
            {/* Audio player skeleton */}
            <View style={styles.skeletonAudioPlayer}>
              {/* Audio player skeleton elements */}
            </View>
            
            {/* View Script button skeleton */}
            <View style={[styles.viewScriptButton, styles.skeletonButton]}>            
              <View style={styles.skeletonIcon}></View>
              <View style={styles.skeletonButtonText}></View>
            </View>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tourData?.place_info?.place_name || place.name}</Text>
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
            {tourData?.audio?.cloudfront_url ? (
              <View style={styles.audioPlayerWithButtons}>
                <GuestAudioPlayer 
                  placeId={place.place_id} 
                  tourType={place.tourType || guestTourParams?.category || 'history'}
                />
                
                {/* View Script button - positioned below audio player */}
                {tourData?.script?.cloudfront_url && (
                  <TouchableOpacity 
                    style={styles.viewScriptButton}
                    onPress={openModal}
                  >
                    <Ionicons name="document-text-outline" size={20} color="white" style={styles.viewScriptIcon} />
                    <Text style={styles.viewScriptText}>View Script</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Audio not available for this location.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Script Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={scriptModalVisible}
        onRequestClose={() => setScriptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tourData?.place_info?.place_name || place?.name || "Tour"}</Text>
              <Text style={styles.modalSubtitle}>{tourData?.place_info?.place_address || place?.vicinity || ""}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setScriptModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scriptScrollView}>
              <Text style={styles.scriptText}>
                {scriptText}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 15,
    textAlign: 'center',
    color: '#FF5722',
    fontWeight: 'bold',
  },
  skeletonContainer: {
    width: '100%',
    padding: 16,
    opacity: 0.5,
  },
  skeletonImageContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonTitleBar: {
    height: 28,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    width: '80%',
  },
  skeletonAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonAddressIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginRight: 8,
  },
  skeletonAddressBar: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    flex: 1,
  },
  skeletonDescriptionContainer: {
    marginVertical: 16,
  },
  skeletonDescriptionTitle: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '50%',
  },
  skeletonDescriptionLine: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
    width: '100%',
  },
  skeletonAudioPlayer: {
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginVertical: 16,
  },
  skeletonButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#c0c0c0',
    borderRadius: 10,
    marginRight: 8,
  },
  skeletonButtonText: {
    height: 16,
    backgroundColor: '#c0c0c0',
    borderRadius: 4,
    width: 80,
  },
  styledLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styledLoadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#FF5722',
    textAlign: 'center',
    fontWeight: '600',
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
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  contentContainer: {
    padding: 15,
  },
  tourTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tourDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 15,
  },
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  audioPlayerContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  audioPlayerWithButtons: {
    marginBottom: 10,
  },
  viewScriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  viewScriptIcon: {
    marginRight: 8,
  },
  viewScriptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  scriptScrollView: {
    padding: 15,
    maxHeight: '70%',
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default GuestAudioScreen;
