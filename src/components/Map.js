import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getPlaces } from '../services/api.ts';
import PlacesList from './PlacesList';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0222;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Map = ({ tourType = 'history' }) => {
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();

  // Get user's location on component mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        setLoading(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });
        
        // Set initial map region
        setRegion({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });

        // Fetch nearby places
        await fetchPlaces(latitude, longitude);
      } catch (err) {
        setError('Error getting location: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch nearby places based on location
  const fetchPlaces = async (latitude, longitude) => {
    try {
      setLoading(true);
      const data = await getPlaces(latitude, longitude, 500, tourType);
      
      if (data && data.places) {
        setPlaces(data.places);
      }
    } catch (err) {
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
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  // Handle marker press
  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
  };

  // Navigate to audio screen
  const navigateToAudio = (place) => {
    navigation.navigate('Audio', { place });
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {places.map((place) => (
            <Marker
              key={place.place_id}
              coordinate={{
                latitude: place.location.lat,
                longitude: place.location.lng,
              }}
              title={place.name}
              description={place.vicinity}
              onPress={() => handleMarkerPress(place)}
            />
          ))}
        </MapView>
      )}

      {/* User location button */}
      <TouchableOpacity
        style={styles.userLocationButton}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>

      {/* Selected place card */}
      {selectedPlace && (
        <View style={styles.placeCardContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedPlace(null)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.placeName}>{selectedPlace.name}</Text>
          <Text style={styles.placeAddress}>{selectedPlace.vicinity}</Text>
          
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => navigateToAudio(selectedPlace)}
          >
            <Ionicons name="headset" size={20} color="#FFF" />
            <Text style={styles.audioButtonText}>Start Audio Tour</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom places list */}
      <View style={styles.placesListContainer}>
        <PlacesList 
          places={places} 
          onPlaceSelect={(place) => {
            setSelectedPlace(place);
            
            // Animate to selected place
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: place.location.lat,
                longitude: place.location.lng,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });
            }
          }}
        />
      </View>

      {/* Loading and error states */}
      {loading && (
        <View style={styles.overlay}>
          <Text>Loading...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  userLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  placeCardContainer: {
    position: 'absolute',
    bottom: 130, // Positioned above the places list
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  audioButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  placesListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'white',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default Map;