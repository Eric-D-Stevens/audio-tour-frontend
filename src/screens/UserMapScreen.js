import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppHeader from '../components/AppHeader';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { TourContext, AuthContext } from '../../App';
import { fetchNearbyPlaces } from '../services/api';

const UserMapScreen = ({ navigation }) => {
  const { tourParams } = useContext(TourContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [tourPoints, setTourPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get user's location and fetch nearby places on component mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
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

        // Fetch nearby places based on location and tour parameters
        await fetchNearbyPlacesData(latitude, longitude);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Error getting location: ' + err.message);
        setLoading(false);
      }
    })();
  }, []);

  // Effect to update tour points when tour parameters change
  useEffect(() => {
    if (tourParams && userLocation) {
      console.log('Tour parameters updated:', tourParams);
      // Clear existing points and show loading animation
      setTourPoints([]);
      setLoadingPoints(true);
      
      // Fade in the loading overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      fetchNearbyPlacesData(userLocation.latitude, userLocation.longitude);
    }
  }, [tourParams, userLocation]);

  // Fetch nearby places based on location and tour parameters
  const fetchNearbyPlacesData = async (latitude, longitude) => {
    try {
      setLoading(true);
      // Ensure the tour type is lowercase to match backend expectations
      const tourType = (tourParams?.category || 'history').toLowerCase();
      // Use the new distance parameter instead of radius
      const distance = tourParams?.distance || 2000;
      
      console.log(`Fetching places with params: ${tourType}, ${distance}m`);
      const data = await fetchNearbyPlaces(latitude, longitude, distance, tourType);
      
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
        
        // Set the tour points with the new data
        setTourPoints(transformedPlaces);
        console.log(`Loaded ${transformedPlaces.length} places`);
      } else {
        // If no places are found, set empty array
        setTourPoints([]);
        console.log('No places found');
      }
    } catch (err) {
      console.error('Error fetching places:', err);
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
        // Force map refresh by slightly adjusting the region
        if (mapRef.current && region) {
          const refreshRegion = {
            ...region,
            // Slightly adjust latitude to force refresh
            latitude: region.latitude + (region.latitudeDelta * 0.0001)
          };
          mapRef.current.animateToRegion(refreshRegion, 100);
          
          // Return to original position after a short delay
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 100);
            }
          }, 150);
        }
      });
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
      <AppHeader navigation={navigation} title="TensorTours Map" />
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
        
        {/* Loading overlay for tour points */}
        {loadingPoints && (
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
    paddingVertical: 8,
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
  }
});

export default UserMapScreen;
