import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioPlayer from '../components/AudioPlayer';
import PhotoAttribution from '../components/PhotoAttribution';
import { getTour, getOnDemandTour } from '../services/api';
import { AuthContext, TourContext, useTheme } from '../contexts';
import logger from '../utils/logger';
import { CDN_ACCESS_KEY, CDN_ACCESS_HEADER } from '../constants/config';

const AudioScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { place } = route.params || {};
  const { tourParams } = useContext(TourContext);
  const [tourData, setTourData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoAttributions, setPhotoAttributions] = useState([]);
  const [photoAttributionUris, setPhotoAttributionUris] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingOnDemand, setIsGeneratingOnDemand] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [scriptModalVisible, setScriptModalVisible] = useState(false);
  const [scriptText, setScriptText] = useState("");

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    backButtonText: { marginLeft: 5, fontSize: 16, color: colors.text, fontWeight: '500' },
    tourTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: colors.text },
    addressText: { fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 20 },
    descriptionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    tourDescription: { fontSize: 16, color: colors.textSecondary, marginBottom: 20, lineHeight: 24 },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? 'rgba(18, 18, 18, 0.92)' : 'rgba(255, 255, 255, 0.92)', zIndex: 1000 },
    loadingIndicatorContainer: {
      position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -125 }, { translateY: -70 }],
      backgroundColor: colors.card, borderRadius: 16, paddingVertical: 24, paddingHorizontal: 30,
      width: 270, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
      elevation: 8, minHeight: 140, zIndex: 1001, borderWidth: 1, borderColor: colors.primaryFaded,
    },
    loadingText: { marginTop: 12, fontSize: 16, fontWeight: '500', color: colors.text, textAlign: 'center', width: '100%' },
    errorText: { fontSize: 18, color: colors.textSecondary, marginTop: 10, marginBottom: 20, textAlign: 'center' },
    imagePlaceholder: { height: 250, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    imagePlaceholderText: { color: colors.textMuted, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: colors.modalBackground, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.card, borderRadius: 16, width: '100%', height: '80%', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, overflow: 'hidden' },
    modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.primaryFadedMore },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
    scriptText: { fontSize: 16, lineHeight: 24, color: colors.text, textAlign: 'left' },
    skeletonImageContainer: { width: '100%', height: 200, backgroundColor: colors.primaryFadedMore, borderRadius: 8, marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    skeletonTitleBar: { width: '70%', height: 24, backgroundColor: colors.border, borderRadius: 4, marginBottom: 16 },
  };
  
  // Function to open the script modal and fetch script content
  const openModal = async () => {
    try {
      setScriptModalVisible(true);
      
      if (tourData?.script?.cloudfront_url) {
        setScriptText("Loading script...");
        
        const response = await fetch(tourData.script.cloudfront_url, {
          headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY }
        });
        if (!response.ok) {
          throw new Error(`Failed to load script: ${response.status}`);
        }
        
        const text = await response.text();
        setScriptText(text);
      } else {
        setScriptText("Script not available for this tour.");
      }
    } catch (error) {
      logger.error("Error loading script:", error);
      setScriptText(`Error loading script: ${error.message}`);
    }
  };

  // Fetch audio tour data including photos
  useEffect(() => {
    const fetchData = async () => {
      // Reset the isOnDemand flag
      if (place) {
        place.isOnDemand = false;
      }
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
        
        logger.debug(`Using tour type: ${tourType} for place: ${place.place_id}`);
        try {
          
          // First, try to get a pre-generated tour
          const response = await getTour(place.place_id, tourType);
          setTourData(response.tour || null);
          
          // Extract photo URLs and attributions from tour data
          const photoUrls = response.tour?.photos?.map(photo => photo.cloudfront_url) || [];
          const attributions = response.tour?.photos?.map(photo => photo.attribution?.displayName || '') || [];
          const attributionUris = response.tour?.photos?.map(photo => photo.attribution?.uri || '') || [];
          setPhotos(photoUrls);
          setPhotoAttributions(attributions);
          setPhotoAttributionUris(attributionUris);
        } catch (tourError) {
          logger.debug('Pre-generated tour not found, generating on-demand:', tourError.message);
          
          // We don't want to show an error, but rather a loading state
          setError(null);
          
          try {
            // Set the proper React state for on-demand generation
            setIsGeneratingOnDemand(true);
            logger.debug('Switching to on-demand generation mode');
            
            // Fallback to generating a tour on demand
            const onDemandResponse = await getOnDemandTour(place.place_id, tourType);
            setTourData(onDemandResponse.tour || null);
            
            // Extract photo URLs and attributions from the on-demand tour data
            const photoUrls = onDemandResponse.tour?.photos?.map(photo => photo.cloudfront_url) || [];
            const attributions = onDemandResponse.tour?.photos?.map(photo => photo.attribution?.displayName || '') || [];
            const attributionUris = onDemandResponse.tour?.photos?.map(photo => photo.attribution?.uri || '') || [];
            setPhotos(photoUrls);
            setPhotoAttributions(attributions);
            setPhotoAttributionUris(attributionUris);
            
            // Clear any error messages
            setError(null);
          } catch (onDemandError) {
            logger.error('Failed to generate on-demand tour:', onDemandError);
            throw new Error(`Unable to generate tour: ${onDemandError.message}`);
          }
        }
      } catch (error) {
        logger.error('Error fetching audio tour:', error);
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
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={dynamicStyles.backButtonText}>Map</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.primary} />
          <Text style={dynamicStyles.errorText}>{error}</Text>
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
    <SafeAreaView style={dynamicStyles.container}>
      {loading && (
        <View style={dynamicStyles.loadingOverlay}>
          {/* Loading indicator with message */}
          <View style={dynamicStyles.loadingIndicatorContainer}>
            <ActivityIndicator size="large" color={colors.primary} style={{transform: [{scale: 1.5}]}} />
            <Text style={dynamicStyles.loadingText}>
              {isGeneratingOnDemand 
                ? "No Tour Found\nGenerating New AI Tour" 
                : "Loading Tour"}
            </Text>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={dynamicStyles.backButtonText}>Map</Text>
          </TouchableOpacity>
        </View>
        
        {photos && photos.length > 0 ? (
          <View>
            {/* Image carousel with pagination dots */}
            <View style={styles.carouselContainer}>
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
                  <View key={index} style={[styles.imageSlide, { backgroundColor: colors.surface }]}>
                    <Image
                      source={{ 
                        uri: photoUrl,
                        headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY }
                      }}
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
            
            {/* Photo attribution below the carousel */}
            <PhotoAttribution 
              attributionName={photoAttributions[currentImageIndex]} 
              attributionUri={photoAttributionUris[currentImageIndex]}
            />
          </View>
        ) : (
          <View style={dynamicStyles.imagePlaceholder}>
            <>
              <Ionicons name="image-outline" size={50} color={colors.textMuted} />
              <Text style={dynamicStyles.imagePlaceholderText}>No Image Available</Text>
            </>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          {/* Place Information Section */}
          <Text style={dynamicStyles.tourTitle}>{tourData?.place_info?.place_name || place.name}</Text>
          
          {/* Address */}
          {tourData?.place_info?.place_address && (
            <View style={styles.infoSection}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={dynamicStyles.addressText}>{tourData.place_info.place_address}</Text>
            </View>
          )}
          
          {/* Editorial Description with Title */}
          {tourData?.place_info?.place_editorial_summary && tourData.place_info.place_editorial_summary.length > 0 ? (
            <View style={styles.descriptionContainer}>
              <Text style={dynamicStyles.descriptionTitle}>About This Location</Text>
              <Text style={dynamicStyles.tourDescription}>{tourData.place_info.place_editorial_summary}</Text>
            </View>
          ) : place.vicinity || place.description ? (
            <View style={styles.descriptionContainer}>
              <Text style={dynamicStyles.descriptionTitle}>Location Details</Text>
              <Text style={dynamicStyles.tourDescription}>{place.vicinity || place.description}</Text>
            </View>
          ) : null}
          
          <View style={styles.audioPlayerContainer}>
            {tourData?.audio?.cloudfront_url ? (
              <View style={styles.audioPlayerWithButtons}>
                <AudioPlayer 
                  placeId={place.place_id} 
                  audioUrl={tourData.audio.cloudfront_url} 
                  placeName={tourData?.place_info?.place_name || place.name}
                  tourType={place.tourType || tourParams.category || 'history'}
                />
                
                {/* View Script button - positioned below audio player */}
                <TouchableOpacity 
                  style={styles.viewScriptButton}
                  onPress={openModal}
                >
                  <Ionicons name="document-text-outline" size={20} color="white" style={styles.viewScriptIcon} />
                  <Text style={styles.viewScriptText}>View Script</Text>
                </TouchableOpacity>
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>{tourData?.place_info?.place_name || place?.name || "Tour"}</Text>
              <Text style={dynamicStyles.modalSubtitle}>{tourData?.place_info?.place_address || place?.vicinity || ""}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setScriptModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scriptScrollView}>
              <Text style={dynamicStyles.scriptText}>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    zIndex: 1000,
  },
  loadingIndicatorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -70 }],  // Widened container positioning
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 30,  // Increased horizontal padding
    width: 270,  // Fixed width to accommodate longer text
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 140,  // Increased height for potentially wrapping text
    zIndex: 1001,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.15)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',  // Ensure text is centered
    width: '100%',  // Allow text to use full container width
  },
  skeletonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 60, // Account for header height
  },
  skeletonImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  skeletonTitleBar: {
    width: '70%',
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonAddressIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginRight: 8,
  },
  skeletonAddressBar: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
  },
  skeletonDescriptionContainer: {
    marginBottom: 24,
  },
  skeletonDescriptionTitle: {
    width: '40%',
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonDescriptionLine: {
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAudioPlayer: {
    height: 160,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  skeletonButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    borderColor: 'rgba(255, 87, 34, 0.2)',
    marginTop: 0,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 10,
  },
  skeletonButtonText: {
    width: 80,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  skeletonAudioPlayerContent: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
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
  },
  audioPlayerWithButtons: {
    width: '100%',
  },
  viewScriptButton: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: '100%',
    zIndex: 100,
  },
  viewScriptIcon: {
    marginRight: 8,
  },
  viewScriptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'rgba(255, 87, 34, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
  },
  scriptScrollView: {
    padding: 20,
  },
  scriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'left',
  },
  imageSlider: {
    height: 235, // Increased to accommodate the attribution
    width: '100%',
  },
  carouselContainer: {
    position: 'relative',  // This allows absolutel positioning of pagination dots
    height: 200,
    width: '100%',
    marginBottom: 0,       // No margin to keep attribution right below
  },
  imageSlide: {
    width: Dimensions.get('window').width,
    height: 235, // Increased to accommodate the attribution
    flexDirection: 'column',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
    resizeMode: 'contain',
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
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#FF5722',
    fontWeight: '600',
    fontSize: 16
  }
});


export default AudioScreen;
