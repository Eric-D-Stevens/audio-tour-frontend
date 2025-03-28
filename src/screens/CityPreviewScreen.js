import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CityPreviewScreen = ({ navigation }) => {
  // Mock data for cities
  const cities = [
    {
      id: '1',
      name: 'San Francisco',
      description: 'Explore the Golden Gate Bridge, Fisherman\'s Wharf, and more',
      tours: 8,
      image: 'https://example.com/sf.jpg',
    },
    {
      id: '2',
      name: 'New York',
      description: 'Discover Central Park, Times Square, and the Statue of Liberty',
      tours: 12,
      image: 'https://example.com/nyc.jpg',
    },
    {
      id: '3',
      name: 'Chicago',
      description: 'Visit Millennium Park, Navy Pier, and the Art Institute',
      tours: 6,
      image: 'https://example.com/chicago.jpg',
    },
    {
      id: '4',
      name: 'Los Angeles',
      description: 'Experience Hollywood, Venice Beach, and Griffith Observatory',
      tours: 9,
      image: 'https://example.com/la.jpg',
    },
    {
      id: '5',
      name: 'Seattle',
      description: 'See the Space Needle, Pike Place Market, and the waterfront',
      tours: 7,
      image: 'https://example.com/seattle.jpg',
    },
  ];

  const renderCityItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.cityCard}
      onPress={() => navigation.navigate('Audio', { tourId: item.id })}
    >
      <View style={styles.cityImagePlaceholder}>
        <Text style={styles.cityImageText}>{item.name}</Text>
      </View>
      <View style={styles.cityContent}>
        <Text style={styles.cityName}>{item.name}</Text>
        <Text style={styles.cityDescription}>{item.description}</Text>
        <View style={styles.cityMeta}>
          <Ionicons name="headset-outline" size={16} color="#666" />
          <Text style={styles.cityMetaText}>{item.tours} audio tours</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Cities</Text>
        <Text style={styles.headerSubtitle}>Discover audio tours in these popular destinations</Text>
      </View>
      
      <FlatList
        data={cities}
        renderItem={renderCityItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  cityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cityImagePlaceholder: {
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  cityContent: {
    padding: 15,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  cityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityMetaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});

export default CityPreviewScreen;
