import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Audio Tour App</Text>
        <Text style={styles.subtitle}>Discover amazing audio tours</Text>
        
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Tours</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('Audio', { tourId: '1' })}
            >
              <View style={styles.cardImagePlaceholder} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>San Francisco Highlights</Text>
                <Text style={styles.cardDescription}>Explore the iconic landmarks of SF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('Audio', { tourId: '2' })}
            >
              <View style={styles.cardImagePlaceholder} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>New York City Walk</Text>
                <Text style={styles.cardDescription}>Experience the Big Apple</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text style={styles.exploreButtonText}>Explore All Tours</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  featuredSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  cardContainer: {
    gap: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImagePlaceholder: {
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
