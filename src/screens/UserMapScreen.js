import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated, Platform, Alert, Linking, AppState, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppHeader from '../components/AppHeader';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import SearchResultToast from '../components/SearchResultToast';
import { TourContext, AuthContext, useTheme } from '../contexts';
import { getPlaces } from '../services/api.ts';
import audioManager from '../services/audioManager';
import logger from '../utils/logger';

// Convert distance in meters to appropriate map delta
// 1 degree of latitude ≈ 111,000 meters
const distanceToMapDelta = (distanceMeters) => {
  // We want the search area to be visible with comfortable padding
  // Multiply by 2 for diameter, then 1.6 for margin
  const latDelta = (distanceMeters * 2 * 1.6) / 111000;
  // Longitude delta is similar but we'll use same value for simplicity
  // (actual ratio depends on latitude but this works well enough)
  return {
    latitudeDelta: Math.max(0.01, Math.min(latDelta, 0.5)), // Clamp between reasonable values
    longitudeDelta: Math.max(0.01, Math.min(latDelta, 0.5)),
  };
};

const UserMapScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { tourParams } = useContext(TourContext);
  const { isAuthenticated, checkAuthAndRedirect, signOut } = useContext(AuthContext);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState(null);
  const [needsJiggle, setNeedsJiggle] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [searchResult, setSearchResult] = useState({ placesCount: 0, distance: 2000 });
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isSelectingRef = useRef(false);

  // State for tracking if location permission was denied
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  // Ref for AppState listener
  const appState = useRef(AppState.currentState);
  
  // Effect to re-check permissions when app returns from background (e.g., from Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        locationPermissionDenied
      ) {
        // App has come to foreground and we previously showed the denied UI
        // Re-check if user granted permission in Settings
        logger.debug('App returned to foreground, re-checking location permission');
        const { status } = await Location.getForegroundPermissionsAsync();
        
        if (status === 'granted') {
          logger.debug('Location permission now granted, proceeding');
          setLocationPermissionDenied(false);
          requestLocationPermission();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [locationPermissionDenied]);
  
  // Function to request location permission and get user's location
  const requestLocationPermission = async () => {
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
        // If permission denied, show the denied permission UI
        setLocationPermissionDenied(true);
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
      
      // Permission granted, clear any denied state
      setLocationPermissionDenied(false);

      // Permission granted, get location and proceed
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      // Set initial map region
      const mapDeltas = distanceToMapDelta(tourParams?.distance || 1500);
      const newRegion = {
        latitude,
        longitude,
        ...mapDeltas,
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
        // Check if permission was previously denied (user explicitly denied) vs never asked
        // On iOS, 'denied' means user explicitly denied, 'undetermined' means never asked
        const isDenied = status === 'denied';
        
        if (isDenied) {
          // Permission was explicitly denied, show the denied UI with settings link
          logger.debug('Location permission denied, showing settings prompt');
          setLocationPermissionDenied(true);
          setLoading(false);
          setLoadingPoints(false);
          
          // Fade out the loading overlay
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          // Permission never asked, request it directly
          logger.debug('No location permission yet, requesting');
          requestLocationPermission();
        }
      } else {
        logger.debug('Location permission already granted, proceeding');
        // Since we have permission, get the user's location
        requestLocationPermission();
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
            logger.debug('No location permission, showing denied UI');
            setLocationPermissionDenied(true);
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
              const mapDeltas = distanceToMapDelta(tourParams?.distance || 1500);
              const newRegion = {
                latitude,
                longitude,
                ...mapDeltas,
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
    // Get distance from tour parameters (declared outside try for use in finally)
    const distance = tourParams?.distance || 1500;
    
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
      // Get number of attractions from tour parameters
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
        
        // Update search result for toast
        setSearchResult({ placesCount: transformedPlaces.length, distance });
      } else {
        // If no places are found, set empty array
        setTourPoints([]);
        logger.debug('No places found');
        
        // Update search result for toast
        setSearchResult({ placesCount: 0, distance });
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
        
        // Show the search result toast
        setToastVisible(true);
        
        // Resize map to match search distance
        if (mapRef.current && userLocation) {
          const mapDeltas = distanceToMapDelta(distance);
          const newRegion = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            ...mapDeltas,
          };
          mapRef.current.animateToRegion(newRegion, 500);
          setRegion(newRegion);
        }
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
        const mapDeltas = distanceToMapDelta(tourParams?.distance || 1500);
        const newRegion = {
          latitude,
          longitude,
          ...mapDeltas,
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
      padding: 12, 
      backgroundColor: colors.card, 
      borderRadius: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    calloutTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    calloutDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    infoPanel: { backgroundColor: colors.background },
    permissionDeniedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 30,
    },
    permissionDeniedTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
      textAlign: 'center',
    },
    permissionDeniedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    settingsButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 10,
      marginBottom: 12,
    },
    settingsButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutLink: {
      marginTop: 8,
    },
    logoutLinkText: {
      color: colors.primary,
      fontSize: 14,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'left', 'right']}>
      <AppHeader navigation={navigation} title="TensorTours" />
      
      {/* Location Permission Denied UI */}
      {locationPermissionDenied ? (
        <View style={dynamicStyles.permissionDeniedContainer}>
          <Ionicons name="location-outline" size={64} color={colors.primary} />
          <Text style={dynamicStyles.permissionDeniedTitle}>Location Access Required</Text>
          <Text style={dynamicStyles.permissionDeniedText}>
            TensorTours needs access to your location to find nearby attractions and create personalized audio tours for you.
          </Text>
          <Text style={dynamicStyles.permissionDeniedText}>
            Please enable location access in your device settings to continue.
          </Text>
          <TouchableOpacity 
            style={dynamicStyles.settingsButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={dynamicStyles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={dynamicStyles.logoutLink}
            onPress={async () => {
              await signOut();
            }}
          >
            <Text style={dynamicStyles.logoutLinkText}>Log out instead</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <>
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton={false}
            clusteringEnabled={false}
            minZoomLevel={0}
            maxZoomLevel={20}
          >
            {tourPoints.map((point) => (
              <Marker
                key={point.id}
                coordinate={point.coordinate}
                tracksViewChanges={false}
                pointerEvents={"auto"}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={30} color="#FF5722" />
                </View>
                <Callout
                  tooltip={true}
                  onPress={async () => {
                    // Prevent multiple rapid selections when markers are close together
                    if (isSelectingRef.current) return;
                    isSelectingRef.current = true;
                    setTimeout(() => { isSelectingRef.current = false; }, 250);
                    
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
        
        {/* Search result toast */}
        <SearchResultToast
          visible={toastVisible}
          placesCount={searchResult.placesCount}
          currentDistance={searchResult.distance}
          tourType={tourParams?.category || 'history'}
          onHide={() => setToastVisible(false)}
        />
        
        {/* Loading overlay for tour points */}
        {(loadingPoints || loading) && (
          <Animated.View 
            style={[styles.loadingOverlay, { opacity: fadeAnim }]}
          >
            <View style={dynamicStyles.loadingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={dynamicStyles.loadingOverlayText}>Finding Nearby Attractions</Text>
            </View>
          </Animated.View>
        )}
        
        {/* User location button */}
        {region && (
          <TouchableOpacity
            style={dynamicStyles.userLocationButton}
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.errorDismiss} 
              onPress={() => setError(null)}
            >
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Bottom Info Panel with Tour Selection Button */}
      <View style={[styles.infoPanel, dynamicStyles.infoPanel]}>
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
      </>
      )}
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
    paddingRight: 35,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorDismiss: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
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
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default UserMapScreen;
