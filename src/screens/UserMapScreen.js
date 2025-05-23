import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated, Platform, Alert, Modal } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppHeader from '../components/AppHeader';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { TourContext, AuthContext } from '../contexts';
import { getPlaces } from '../services/api.ts';
import audioManager from '../services/audioManager';
import logger from '../utils/logger';

const UserMapScreen = ({ navigation }) => {
  const { tourParams } = useContext(TourContext);
  const { isAuthenticated, checkAuthAndRedirect, signOut } = useContext(AuthContext);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState(null);
  const [needsJiggle, setNeedsJiggle] = useState(false);
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State for permission modal - initially hidden until we check permission status
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  // Function to handle accepting location permission
  const handleAcceptLocationPermission = async () => {
    setShowPermissionModal(false);
    
    // Explicitly set loading states to true and animate the loading overlay
    setLoading(true);
    setLoadingPoints(true);
    
    // Fade in the loading overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // If permission still denied, show error
        setError('Permission to access location was denied');
        setLoading(false);
        setLoadingPoints(false);
        
        // Fade out the loading overlay
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return;
      }

      // Permission granted, get location and proceed
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      // Set initial map region
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);

      // Fetch nearby places based on location and tour parameters
      await fetchNearbyPlacesData(latitude, longitude);
    } catch (err) {
      logger.error('Error getting location:', err);
      setError('Error getting location: ' + err.message);
      setLoading(false);
      setLoadingPoints(false);
      
      // Fade out the loading overlay on error
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };
  
  // Function to handle declining location permission
  const handleDeclineLocationPermission = async () => {
    // Logout the user through the auth context
    // This will automatically navigate to the Auth screen
    await signOut();
  };
  
  // Initialize with authentication check and permission check
  useEffect(() => {
    // Immediately show loading state and animate the loading overlay when component mounts
    setLoading(true);
    setLoadingPoints(true);
    
    // Fade in the loading overlay immediately
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    (async () => {
      // First verify authentication is still valid
      try {
        const isAuthValid = await checkAuthAndRedirect(navigation);
        if (!isAuthValid) {
          logger.debug('Authentication validation failed, continuing as guest user');
          // We'll continue operation to allow basic functionality even if auth fails
          // This prevents unnecessary disruption during token refresh issues
        }
      } catch (error) {
        logger.debug('Authentication check error, continuing as guest user:', error.message);
        // Continue operation rather than blocking app functionality
      }
      
      // Check if we already have location permission
      const { status } = await Location.getForegroundPermissionsAsync();
      logger.debug('Current location permission status:', status);
      
      if (status !== 'granted') {
        // Only show the modal if we don't have permission yet
        logger.debug('No location permission, showing modal');
        setShowPermissionModal(true);
        setLoading(false);
        setLoadingPoints(false);
        
        // Fade out the loading overlay
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        logger.debug('Location permission already granted, proceeding');
        // Since we have permission, get the user's location
        // handleAcceptLocationPermission will handle the loading states
        handleAcceptLocationPermission();
      }
    })();
  }, []);

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

  // Effect to update tour points when tour parameters change
  useEffect(() => {
    if (tourParams) {
      logger.debug('Tour parameters updated:', tourParams);
      
      // Clear existing points and show loading animation
      setTourPoints([]);
      setLoadingPoints(true);
      
      // Fade in the loading overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Get fresh location when tour parameters change
      (async () => {
        try {
          // Try to refresh token if needed, but continue operation even if it fails
          try {
            const isAuthValid = await checkAuthAndRedirect(navigation);
            if (!isAuthValid) {
              logger.debug('Authentication validation failed, continuing as guest user');
              // Continue operation to maintain user experience
            }
          } catch (error) {
            logger.debug('Authentication check error, continuing as guest user:', error.message);
            // Continue rather than disrupting the experience
          }
          
          // Check if we have location permission
          const { status } = await Location.getForegroundPermissionsAsync();
          logger.debug('Current location permission status for tour params update:', status);
          
          if (status !== 'granted') {
            logger.debug('No location permission, showing modal');
            setShowPermissionModal(true);
            setLoadingPoints(false);
            return;
          }
          
          // If we have permission, get fresh location
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            const { latitude, longitude } = location.coords;
            const newUserLocation = { latitude, longitude };
            
            // Set the location in context
            setUserLocation(newUserLocation);
            
            // Recenter the map on user's location
            if (mapRef.current) {
              const newRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
              mapRef.current.animateToRegion(newRegion);
              // Update region state to keep it in sync with the map
              setRegion(newRegion);
            }
            
            // Fetch new places at current location
            await fetchNearbyPlacesData(latitude, longitude);
          } catch (locationError) {
            logger.error('Error getting current position:', locationError);
            setError('Error getting current location. Please try again.');
            setLoadingPoints(false);
          }
        } catch (err) {
          logger.error('Error updating location for tour parameters:', err);
          setError('Error updating location: ' + err.message);
          setLoadingPoints(false);
        }
      })();
    }
  }, [tourParams]);

  // Fetch nearby places based on location and tour parameters
  const fetchNearbyPlacesData = async (latitude, longitude) => {
    try {
      // Verify authentication is still valid before proceeding with API request
      const isAuthValid = await checkAuthAndRedirect(navigation);
      if (!isAuthValid) {
        logger.debug('Authentication validation failed, aborting fetch');
        setLoadingPoints(false);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setLoadingPoints(true);
      
      // Ensure the tour type is lowercase to match backend expectations
      const tourType = (tourParams?.category || 'history').toLowerCase();
      // Get distance and number of attractions from tour parameters
      const distance = tourParams?.distance || 2000;
      const maxResults = tourParams?.numAttractions || 15;
      
      logger.debug(`Fetching places with params: ${tourType}, ${distance}m, max results: ${maxResults}`);
      const data = await getPlaces(latitude, longitude, distance, tourType, maxResults);
      
      if (data && data.places) {
        // Transform the places data to match the expected format for markers
        const transformedPlaces = data.places.map((place, index) => {
          
          // Handle the new TTPlaceInfo model structure
          return {
            id: place.place_id || String(index),
            title: place.place_name || place.name || 'Unknown Place',
            description: place.place_editorial_summary || place.place_address || place.vicinity || '',
            coordinate: {
              // Check for different location field structures
              latitude: place.place_location?.latitude || 
                      place.place_location?.lat || 
                      place.location?.lat || 
                      place.latitude || 
                      0,
              longitude: place.place_location?.longitude || 
                       place.place_location?.lng || 
                       place.location?.lng || 
                       place.longitude || 
                       0
            },
            // Keep the original data for detailed view
            originalData: place
          };
        });
        
        // Set the tour points with the new data
        setTourPoints(transformedPlaces);
        logger.debug(`Loaded ${transformedPlaces.length} places`);
      } else {
        // If no places are found, set empty array
        setTourPoints([]);
        logger.debug('No places found');
      }
    } catch (err) {
      logger.error('Error fetching places:', err);
      setError('Error fetching places: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingPoints(false);
      
      // Fade out the loading overlay
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Instead of immediately jiggling, set a flag that we need to jiggle
        // The actual jiggle will happen after the map has finished any ongoing animations
        setNeedsJiggle(true);
      });
    }
  };

  // Center the map on the user's location and refresh data
  const centerOnUser = async () => {
    try {
      // Try to refresh token if needed, but continue operation even if it fails
      try {
        const isAuthValid = await checkAuthAndRedirect(navigation);
        if (!isAuthValid) {
          logger.debug('Authentication validation failed, continuing as guest user');
          // Continue operation to maintain user experience
        }
      } catch (error) {
        logger.debug('Authentication check error, continuing as guest user:', error.message);
        // Continue rather than disrupting the experience
      }
      
      // Get fresh location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      // Animate map to new location
      if (mapRef.current) {
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        mapRef.current.animateToRegion(newRegion);
        // Also update the region state to keep it in sync
        setRegion(newRegion);
      } else {
        logger.warn('Map reference is null, cannot center map');
      }
    } catch (err) {
      logger.error('Error updating location:', err);
      setError('Error updating location: ' + err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader navigation={navigation} title="TensorTours Map" />
      
      {/* Location Permission Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPermissionModal}
        onRequestClose={() => navigation.navigate('Auth')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location Access</Text>
            </View>
            
            <Text style={styles.modalText}>
              TensorTours uses your location to create personalized audio tours for attractions near you. Your location is only used while you're using the app.
            </Text>
            
            <Text style={styles.modalText}>
              Without location access, the app cannot function properly.
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleDeclineLocationPermission}
              >
                <Text style={styles.secondaryButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleAcceptLocationPermission}
              >
                <Text style={styles.primaryButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            ref={mapRef}
            provider={Constants.appOwnership === 'expo' ? undefined : PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {tourPoints.map((point) => (
              <Marker
                key={point.id}
                coordinate={point.coordinate}
              >
                <Callout
                  onPress={async () => {
                    // Verify authentication is still valid before navigating
                    const isAuthValid = await checkAuthAndRedirect(navigation);
                    if (!isAuthValid) {
                      logger.debug('Authentication validation failed, aborting navigation to AudioScreen');
                      return;
                    }
                    
                    // Navigate to Audio screen
                    // Include the tour type from TourContext when navigating to AudioScreen
                    const placeWithTourType = {
                      ...point.originalData,
                      tourType: tourParams.category // Add the current tour type from context
                    };
                    logger.debug(`Navigating to AudioScreen with tour type: ${tourParams.category}`);
                    navigation.navigate('Audio', { place: placeWithTourType });
                    
                    // Also load the audio in the mini player if available
                    if (point.originalData && point.originalData.audio_url) {
                      audioManager.loadAudio(
                        point.originalData.audio_url,
                        point.originalData.place_id,
                        point.originalData.name
                      );
                    }
                  }}
                  style={styles.callout}
                >
                  <View style={styles.calloutContent}>
                    <Text style={styles.calloutTitle}>{point.title}</Text>
                    <Text style={styles.calloutDescription}>{point.description}</Text>
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
          <View style={[styles.map, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        
        {/* Loading overlay for tour points */}
        {(loadingPoints || loading) && (
          <Animated.View 
            style={[styles.loadingOverlay, { opacity: fadeAnim }]}
          >
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#FF5722" />
              <Text style={styles.loadingOverlayText}>Loading tour points...</Text>
            </View>
          </Animated.View>
        )}
        
        {/* User location button */}
        {region && (
          <TouchableOpacity
            style={styles.userLocationButton}
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color="#FF5722" />
          </TouchableOpacity>
        )}
        
        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      
      {/* Bottom Info Panel with Tour Selection Button */}
      <View style={styles.infoPanel}>
        <View style={styles.leftControls}>
          <MiniAudioPlayer />
        </View>
        <TouchableOpacity 
          style={styles.tourButton}
          onPress={() => navigation.navigate('TourParameters')}
        >
          <Text style={styles.tourButtonText}>Tour Settings</Text>
          <Ionicons name="settings-outline" size={16} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
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
    zIndex: 1000,
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
  infoPanel: {
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8, // Extra padding for iOS home indicator
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  leftControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tourButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  tourButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  bottomContainer: {
    backgroundColor: 'transparent',
  },
  userLocationButton: {
    position: 'absolute',
    bottom: 100,
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
    backgroundColor: '#f8f9fa',
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
  callout: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 0,
  },
  calloutContent: {
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  calloutButtonIcon: {
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF5722',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserMapScreen;
