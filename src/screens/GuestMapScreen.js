import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppHeader from '../components/AppHeader';
import { TourContext } from '../../App';
import { fetchCityPreview } from '../services/api';

const GuestMapScreen = ({ navigation }) => {
  const { tourParams } = useContext(TourContext);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(true);
  const mapRef = useRef(null);
  
  // Default city for preview mode
  const defaultCity = 'San Francisco';

  // Get user's location and fetch city preview data on component mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // If location permission is denied, use default city
          setError('Using default city (San Francisco) - location permission denied');
          await fetchCityPreviewData(defaultCity);
          return;
        }

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

        // In preview mode, we'll still use the default city
        // but center the map at the user's location
        await fetchCityPreviewData(defaultCity);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Using default city - ' + err.message);
        await fetchCityPreviewData(defaultCity);
      }
    })();
  }, []);

  // Effect to update tour points when tour parameters change
  useEffect(() => {
    if (tourParams) {
      console.log('Tour parameters updated:', tourParams);
      fetchCityPreviewData(defaultCity);
    }
  }, [tourParams]);

  // Fetch city preview data
  const fetchCityPreviewData = async (city) => {
    try {
      setLoading(true);
      const tourType = tourParams?.category || 'history';
      
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

  // Center the map on the user's location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="TensorTours Preview" />
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            ref={mapRef}
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
                title={point.title}
                description={point.description}
                onCalloutPress={() => navigation.navigate('Audio', { place: point.originalData })}
              />
            ))}
          </MapView>
        ) : (
          <View style={[styles.map, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
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
        <View style={styles.infoPanelContent}>
          <Text style={styles.infoPanelTitle}>Preview Tour</Text>
          <Text style={styles.infoPanelText}>
            {tourParams ? `${tourParams.category} tour (${tourParams.duration} min)` : 'Explore sample tours in preview mode'}
          </Text>
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
    backgroundColor: '#f8f9fa',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
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
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
