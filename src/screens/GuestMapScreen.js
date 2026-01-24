import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, ActivityIndicator, Animated, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { TourContext, useTheme } from '../contexts';
import { getPreviewPlaces } from '../services/api.ts';
import { PRESET_CITIES, getCityById, getDefaultCity } from '../constants/cities';
import audioManager from '../services/audioManager';
import logger from '../utils/logger';

const GuestMapScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { guestTourParams } = useContext(TourContext);
  const [region, setRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(true);
  const [needsJiggle, setNeedsJiggle] = useState(false);
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
    loadingOverlayText: { marginTop: 10, fontSize: 16, color: colors.text, textAlign: 'center', fontWeight: '600' },
    loadingContent: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      minWidth: 200,
    },
    userLocationButton: {
      position: 'absolute',
      bottom: 100,
      right: 15,
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 30,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    callout: { backgroundColor: 'transparent' },
    calloutContent: { 
      padding: 10, 
      minWidth: 180, 
      backgroundColor: colors.card, 
      borderRadius: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    calloutTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: colors.text },
    calloutDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
    modalOverlay: { flex: 1, backgroundColor: colors.modalBackground, justifyContent: 'center', alignItems: 'center' },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    modalTitle2: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 15, marginBottom: 5 },
    modalText: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, lineHeight: 20 },
    benefitText: { flex: 1, fontSize: 14, color: colors.textSecondary },
    infoPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
    errorContainer: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: colors.error, padding: 10, borderRadius: 8 },
    errorText: { color: colors.buttonText, fontSize: 14, textAlign: 'center' },
  };

  // Initialize with selected city or default city on component mount
  useEffect(() => {
    // Initialize the map with a default city
    try {
      // Get the selected city from guest tour params or use default
      const cityId = guestTourParams?.cityId || getDefaultCity().id;
      const city = getCityById(cityId);
      setSelectedCity(city);
      
      // Set initial map region based on the city coordinates
      const newRegion = {
        latitude: city.coordinate.latitude,
        longitude: city.coordinate.longitude,
        latitudeDelta: 0.19,
        longitudeDelta: 0.09,
      };
      setRegion(newRegion);
      
      // Data fetching will be handled by the useEffect that watches guestTourParams
    } catch (err) {
      logger.error('Error initializing map:', err);
      setError('Error loading city data: ' + err.message);
      
      // Fallback to default city
      const defaultCity = getDefaultCity();
      setSelectedCity(defaultCity);
      setRegion({
        latitude: defaultCity.coordinate.latitude,
        longitude: defaultCity.coordinate.longitude,
        latitudeDelta: 0.19,
        longitudeDelta: 0.09,
      });
    }
  }, []);

  // Effect to update tour points when guest tour parameters change
  useEffect(() => {
    const handleTourParamsChange = async () => {
      if (guestTourParams && guestTourParams.cityId) {
        logger.debug('Guest tour parameters updated:', JSON.stringify(guestTourParams));
        const city = getCityById(guestTourParams.cityId);
        
        if (city) {
          logger.debug(`Processing city: ${city.name} (ID: ${city.id})`);
          
          // Clear existing points first
          setTourPoints([]);
          setLoading(true);
          
          // Update selected city in state
          setSelectedCity(city);
          
          // Update map region to the new city
          if (mapRef.current) {
            const newRegion = {
              latitude: city.coordinate.latitude,
              longitude: city.coordinate.longitude,
              latitudeDelta: 0.19,
              longitudeDelta: 0.09,
            };
            logger.debug(`Animating map to: ${newRegion.latitude}, ${newRegion.longitude}`);
            mapRef.current.animateToRegion(newRegion, 500);
            setRegion(newRegion);
          }
          
          // Wait a bit for the map to start moving
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Then fetch city preview data using the CITY ID directly from parameters
          // This is critical - we need to use the ID from the parameters, not the name
          logger.debug(`Fetching preview data for city ID: ${guestTourParams.cityId}`);
          
          try {
            // Pass the city ID from parameters directly to prevent any mismatch
            await fetchCityPreviewData(guestTourParams.cityId);
            logger.debug(`Preview data fetched for ${city.name} (ID: ${guestTourParams.cityId})`);
          } catch (err) {
            logger.error('Error fetching city preview data:', err);
            setError('Failed to load city data. Please try again.');
            setLoading(false);
          }
        }
      }
    };
    
    // Execute the async function
    handleTourParamsChange();
  }, [guestTourParams]);

  // Fetch city preview data
  // Effect to handle loading animation
  useEffect(() => {
    if (loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Set the jiggle flag after the fade-out animation completes
        setNeedsJiggle(true);
      });
    }
  }, [loading]);

  // Effect to handle map region changes and perform jiggle when needed
  useEffect(() => {
    if (region && needsJiggle) {
      // Only perform the jiggle if we have a region and the flag is set
      // This ensures the map has finished any centering animations
      
      // Small delay to ensure the map is fully settled
      const jiggleTimeout = setTimeout(() => {
        if (mapRef.current) {
          // First, create a very slightly adjusted region (almost imperceptible to user)
          const refreshRegion = {
            ...region,
            latitude: region.latitude + (region.latitudeDelta * 0.0001)
          };
          
          // Apply the tiny change to force a re-render
          mapRef.current.animateToRegion(refreshRegion, 100);
          
          // Then go back to the original region after a short delay
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 100);
            }
          }, 150);
          
          // Reset the flag
          setNeedsJiggle(false);
        }
      }, 300); // Wait 300ms after region change to ensure map is settled
      
      return () => clearTimeout(jiggleTimeout);
    }
  }, [region, needsJiggle]);

  const fetchCityPreviewData = async (cityId) => {
    try {
      // IMPORTANT: Use the cityId parameter directly and DO NOT override it
      // This ensures we're using the ID from the tour parameters, not from the selectedCity state
      logger.debug(`Fetching data for exact city ID: ${cityId}`);
      
      // Get tour type from parameters
      const tourType = (guestTourParams?.category || 'history').toLowerCase();
      
      logger.debug(`Making CloudFront request for ${cityId}/${tourType}...`);
      
      // Make the request using the EXACT cityId that was passed in
      const data = await getPreviewPlaces(cityId, tourType);
      logger.debug(`CloudFront request completed with ${data?.places?.length || 0} places`);
      
      // Process the places data
      if (data && data.places && data.places.length > 0) {
        // Transform the data for map markers
        const transformedPlaces = [];
        
        // Process each place item
        for (const place of data.places) {
          // Extract location data
          const lat = Number(place.place_location?.latitude || 
                         place.place_location?.lat || 
                         place.location?.lat || 
                         place.latitude || 
                         0);
          
          const lng = Number(place.place_location?.longitude || 
                          place.place_location?.lng || 
                          place.location?.lng || 
                          place.longitude || 
                          0);
          
          // Only include places with valid coordinates
          if (lat && lng) {
            transformedPlaces.push({
              id: place.place_id || `place-${transformedPlaces.length}`,
              title: place.place_name || place.name || 'Unknown Place',
              description: place.place_editorial_summary || place.place_address || place.vicinity || '',
              coordinate: { latitude: lat, longitude: lng },
              originalData: place
            });
          }
        }
        
        // Clear existing points first
        setTourPoints([]);
        
        // Brief delay to ensure old points are cleared
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Set the new points
        logger.debug(`Setting ${transformedPlaces.length} valid tour points for ${cityId}`);
        setTourPoints(transformedPlaces);
        
        // Trigger map refresh with delay to ensure React has updated state
        setTimeout(() => {
          setNeedsJiggle(true);
          logger.debug('Map jiggle triggered to refresh markers');
        }, 300);
      } else {
        logger.debug(`No places found in response for city ID: ${cityId}`);
        setTourPoints([]);
      }
    } catch (err) {
      logger.error(`Error fetching preview places for city ID ${cityId}:`, err);
      setError('Error fetching places: ' + err.message);
    } finally {
      // Ensure loading state is cleared
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Center the map on the selected city
  const centerOnCity = () => {
    if (selectedCity && mapRef.current) {
      const newRegion = {
        latitude: selectedCity.coordinate.latitude,
        longitude: selectedCity.coordinate.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapRef.current.animateToRegion(newRegion, 500);
      setRegion(newRegion);
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <AppHeader navigation={navigation} title="TensorTours Preview" />
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
          >
            {tourPoints.map((point) => (
              <Marker
                key={point.id}
                coordinate={point.coordinate}
                tracksViewChanges={false}
              >
                <Callout
                  tooltip={true}
                  onPress={() => {
                    // Navigate to Audio screen
                    // Include the tour type from guestTourParams when navigating to AudioScreen
                    const placeWithTourType = {
                      ...point.originalData,
                      tourType: guestTourParams?.category || 'history' // Add the current tour type from context
                    };
                    logger.debug(`Navigating to AudioScreen with tour type: ${guestTourParams?.category || 'history'}`);
                    navigation.navigate('GuestAudio', { place: placeWithTourType });
                    
                    // Also load the audio in the mini player if available
                    if (point.originalData && point.originalData.audio_url) {
                      audioManager.loadAudio(
                        point.originalData.audio_url,
                        point.originalData.place_id,
                        point.originalData.name
                      );
                    }
                  }}
                  style={[styles.callout, dynamicStyles.callout]}
                >
                  <View style={dynamicStyles.calloutContent}>
                    <Text style={dynamicStyles.calloutTitle}>{point.title}</Text>
                    <Text style={dynamicStyles.calloutDescription}>{point.description}</Text>
                    <View style={styles.calloutButton}>
                      <Text style={styles.calloutButtonText}>Start Audio Tour</Text>
                      <Ionicons name="play" size={16} color="white" style={styles.calloutButtonIcon} />
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[styles.map, dynamicStyles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={dynamicStyles.loadingText}>Loading map...</Text>
          </View>
        )}
        
        {loading && (
          <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
            <View style={dynamicStyles.loadingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={dynamicStyles.loadingOverlayText}>Loading Preview Locations</Text>
            </View>
          </Animated.View>
        )}
        
        {/* Center on city button */}
        {region && (
          <TouchableOpacity
            style={dynamicStyles.userLocationButton}
            onPress={centerOnCity}
          >
            <Ionicons name="location" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {/* Preview Mode Button */}
        <TouchableOpacity 
          style={styles.previewButton}
          onPress={() => setPreviewModalVisible(true)}
        >
          <Text style={styles.previewButtonText}>Preview Mode</Text>
          <Ionicons name="help-circle" size={16} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>
        
        {/* Error message */}
        {error && (
          <View style={dynamicStyles.errorContainer}>
            <Text style={dynamicStyles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      
      {/* Bottom Info Panel with Tour Selection Button */}
      <View style={dynamicStyles.infoPanel}>
        <View style={styles.leftControls}>
          <MiniAudioPlayer targetScreen="GuestAudio" />
        </View>
        
        <TouchableOpacity 
          style={styles.tourButton}
          onPress={() => navigation.navigate('GuestTourParameters')}
        >
          <Text style={styles.tourButtonText}>Tour Settings</Text>
          <Ionicons name="settings-outline" size={16} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Preview Mode Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Preview Mode</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={dynamicStyles.modalTitle2}>What is Guest Mode?</Text>
            <Text style={dynamicStyles.modalText}>
              You're exploring TensorTours in Guest Mode, which gives you access to our demo content from pre-selected cities around the world. These tours showcase what TensorTours can do, but don't use your actual location.
            </Text>
            
            <Text style={dynamicStyles.modalTitle2}>Benefits of Logging In</Text>
            <Text style={dynamicStyles.modalText}>
              When you create an account and log in, TensorTours will:
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="location" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={dynamicStyles.benefitText}>Generate tours based on your current location</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="options" size={16} color={colors.primary} style={styles.benefitIcon} />
                <Text style={dynamicStyles.benefitText}>Personalize content based on your preferences</Text>
              </View>
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => {
                  setPreviewModalVisible(false);
                  navigation.navigate('Auth');
                }}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => setPreviewModalVisible(false)}
              >
                <Text style={styles.continueButtonText}>Continue in Guest Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  callout: {
    width: 250,
    padding: 0,
  },
  calloutContent: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  calloutButton: {
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  calloutButtonIcon: {
    marginLeft: 2,
  },
  previewButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 87, 34, 0.9)', // Semi-transparent orange
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8, // Extra padding for iOS home indicator
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 10,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoPanelContent: {
    flex: 1,
  },
  infoPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  infoPanelText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tourButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tourButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  userLocationButton: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
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
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalTitle2: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  benefitsList: {
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    marginRight: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  modalButtonsContainer: {
    flexDirection: 'column',
    marginTop: 10,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF5722',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GuestMapScreen;
