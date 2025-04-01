import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { TourContext, AuthContext } from '../../App';

const UserMapScreen = ({ navigation }) => {
  const { tourParams } = useContext(TourContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [tourPoints, setTourPoints] = useState([
    { id: '1', title: 'Golden Gate Bridge', description: 'Iconic suspension bridge', coordinate: { latitude: 37.8199, longitude: -122.4783 } },
    { id: '2', title: 'Fisherman\'s Wharf', description: 'Popular tourist attraction', coordinate: { latitude: 37.8080, longitude: -122.4177 } },
    { id: '3', title: 'Alcatraz Island', description: 'Historic federal prison', coordinate: { latitude: 37.8270, longitude: -122.4230 } },
  ]);

  // Effect to update tour points when tour parameters change
  useEffect(() => {
    if (tourParams) {
      console.log('Tour parameters updated:', tourParams);
      // In a real app, this would call your lambda to get new tour points
      // For now, we'll just log the parameters
    }
  }, [tourParams]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} title="TensorTours Map" />
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
        >
          {tourPoints.map((point) => (
            <Marker
              key={point.id}
              coordinate={point.coordinate}
              title={point.title}
              description={point.description}
              onCalloutPress={() => navigation.navigate('Audio', { tourId: point.id })}
            />
          ))}
        </MapView>
      </View>
      
      {/* Bottom Info Panel with Tour Selection Button */}
      <View style={styles.infoPanel}>
        <View style={styles.infoPanelContent}>
          <Text style={styles.infoPanelTitle}>Explore Tour Points</Text>
          <Text style={styles.infoPanelText}>
            {tourParams ? `${tourParams.category} tour (${tourParams.duration} min)` : 'Tap on markers to view available audio tours'}
          </Text>
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
  }
});

export default UserMapScreen;
