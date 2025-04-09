import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, ActivityIndicator, Animated, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { TourContext } from '../../App';
import { fetchCityPreview } from '../services/api';
import { PRESET_CITIES, getCityById, getDefaultCity } from '../constants/cities';
import audioManager from '../services/audioManager';

const GuestMapScreen = ({ navigation }) => {
  const { guestTourParams } = useContext(TourContext);
  const [region, setRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(true);
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize with selected city or default city on component mount
  useEffect(() => {
    (async () => {
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

        // Fetch city preview data
        await fetchCityPreviewData(city.name);
      } catch (err) {
        console.error('Error initializing map:', err);
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
        await fetchCityPreviewData(defaultCity.name);
      }
    })();
  }, []);

  // Effect to update tour points when guest tour parameters change
  useEffect(() => {
    if (guestTourParams && guestTourParams.cityId) {
      console.log('Guest tour parameters updated:', guestTourParams);
      const city = getCityById(guestTourParams.cityId);
      
      if (city) {
        setSelectedCity(city);
        
        // Update map region to the new city
        if (mapRef.current) {
          const newRegion = {
            latitude: city.coordinate.latitude,
            longitude: city.coordinate.longitude,
            latitudeDelta: 0.19,
            longitudeDelta: 0.09,
          };
          mapRef.current.animateToRegion(newRegion, 500);
          setRegion(newRegion);
        }
        
        // Fetch city preview data
        fetchCityPreviewData(city.name);
      }
    }
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
      }).start();
    }
  }, [loading]);

  const fetchCityPreviewData = async (city) => {
    try {
      setLoading(true);
      // Ensure the tour type is lowercase to match backend expectations
      const tourType = (guestTourParams?.category || 'history').toLowerCase();
      
      const data = await fetchCityPreview(city, tourType);
      
      if (data && data.places) {
        // Transform the places data to match the expected format for markers
        const transformedPlaces = data.places.map((place, index) => ({
          id: place.place_id || String(index),
          title: place.name,
          description: place.vicinity || place.description || '',
          coordinate: {
            latitude: place.location.lat,
            longitude: place.location.lng
          },
          // Keep the original data for detailed view
          originalData: place
        }));
        
        setTourPoints(transformedPlaces);
      } else {
        // If no places are found, set empty array
        setTourPoints([]);
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Error fetching places: ' + err.message);
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="TensorTours Preview" />
      <View style={styles.mapContainer}>
        {loading && (
          <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#FF5722" />
              <Text style={styles.loadingOverlayText}>Loading places...</Text>
            </View>
          </Animated.View>
        )}
        {region ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
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
                  onPress={() => {
                    // Navigate to Audio screen
                    // Include the tour type from guestTourParams when navigating to AudioScreen
                    const placeWithTourType = {
                      ...point.originalData,
                      tourType: guestTourParams?.category || 'history' // Add the current tour type from context
                    };
                    console.log(`Navigating to AudioScreen with tour type: ${guestTourParams?.category || 'history'}`);
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
        
        {/* Center on city button */}
        {region && (
          <TouchableOpacity
            style={styles.userLocationButton}
            onPress={centerOnCity}
          >
            <Ionicons name="location" size={24} color="#FF5722" />
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      
      {/* Bottom Info Panel with Tour Selection Button */}
      <View style={styles.infoPanel}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview Mode</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              You are currently in Preview Mode. In this mode, TensorTours provides a limited selection of pre-recorded audio tours to demonstrate the app's functionality.
            </Text>
            
            <Text style={styles.modalText}>
              In the full version, our AI will generate personalized tours based on your preferences, location, and interests in real-time.
            </Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
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
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
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
