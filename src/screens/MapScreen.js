import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const MapScreen = ({ navigation }) => {
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

  return (
    <SafeAreaView style={styles.container}>
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
      <View style={styles.infoPanel}>
        <Text style={styles.infoPanelTitle}>Explore Tour Points</Text>
        <Text style={styles.infoPanelText}>
          Tap on markers to view available audio tours at each location.
        </Text>
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
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  infoPanel: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  infoPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoPanelText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default MapScreen;
