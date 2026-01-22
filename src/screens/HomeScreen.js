import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts';

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: 32, fontWeight: 'bold', color: colors.primary, marginTop: 10 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: colors.text },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardImagePlaceholder: { height: 150, backgroundColor: colors.surface },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: colors.text },
    cardDescription: { fontSize: 14, color: colors.textSecondary },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={dynamicStyles.title}>TensorTours</Text>
        <Text style={dynamicStyles.subtitle}>Discover amazing audio tours powered by AI</Text>
        
        <View style={styles.featuredSection}>
          <Text style={dynamicStyles.sectionTitle}>Featured Tours</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity 
              style={dynamicStyles.card}
              onPress={() => navigation.navigate('Audio', { tourId: '1' })}
            >
              <View style={dynamicStyles.cardImagePlaceholder} />
              <View style={styles.cardContent}>
                <Text style={dynamicStyles.cardTitle}>San Francisco Highlights</Text>
                <Text style={dynamicStyles.cardDescription}>Explore the iconic landmarks of SF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={dynamicStyles.card}
              onPress={() => navigation.navigate('Audio', { tourId: '2' })}
            >
              <View style={dynamicStyles.cardImagePlaceholder} />
              <View style={styles.cardContent}>
                <Text style={dynamicStyles.cardTitle}>New York City Walk</Text>
                <Text style={dynamicStyles.cardDescription}>Experience the Big Apple</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Map')}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5722', // Orange color for TensorTours branding
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
    backgroundColor: '#FF5722', // Orange color for TensorTours branding
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
