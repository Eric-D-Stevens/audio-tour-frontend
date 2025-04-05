import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TourContext } from '../../App';

const TourParametersScreen = ({ navigation }) => {
  const { tourParams, setTourParams } = useContext(TourContext);
  
  // Local state to track changes before saving
  const [distance, setDistance] = useState(tourParams.distance ?? 2000);
  const [numAttractions, setNumAttractions] = useState(tourParams.numAttractions ?? 5);
  const [category, setCategory] = useState(tourParams.category ?? 'history');

  // Convert meters to miles for display
  const metersToMiles = (meters) => (meters * 0.000621371).toFixed(1);
  // Convert miles to meters for API
  const milesToMeters = (miles) => Math.round(miles / 0.000621371);
  
  // Tour types that match the backend geolocation lambda
  const categories = [
    { id: 'history', name: 'History' },
    { id: 'cultural', name: 'Cultural' },
    { id: 'art', name: 'Art' },
    { id: 'nature', name: 'Nature' },
    { id: 'architecture', name: 'Architecture' }
  ];
  
  const handleSave = () => {
    // Update the global tour parameters
    setTourParams({
      distance,
      numAttractions,
      category
    });
    
    // Navigate back to map
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tour Settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Distance</Text>
          <Text style={styles.paramValue}>{metersToMiles(distance)} miles</Text>
          <Slider
            value={distance}
            onValueChange={value => setDistance(value[0])}
            minimumValue={500}
            maximumValue={8000}
            step={500}
            containerStyle={styles.slider}
            trackStyle={{ backgroundColor: '#D3D3D3' }}
            minimumTrackTintColor="#FF5722"
            thumbTintColor="#FF5722"
            renderThumbComponent={() => (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#FF5722',
              }} />
            )}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0.3 miles</Text>
            <Text style={styles.sliderLabel}>5 miles</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Attractions</Text>
          <Text style={styles.paramValue}>{numAttractions} places</Text>
          <Slider
            value={numAttractions}
            onValueChange={value => setNumAttractions(value[0])}
            minimumValue={3}
            maximumValue={20}
            step={1}
            containerStyle={styles.slider}
            trackStyle={{ backgroundColor: '#D3D3D3' }}
            minimumTrackTintColor="#FF5722"
            thumbTintColor="#FF5722"
            renderThumbComponent={() => (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#FF5722',
              }} />
            )}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>3 places</Text>
            <Text style={styles.sliderLabel}>20 places</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tour Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryButton,
                  category === item.id && styles.categoryButtonActive
                ]}
                onPress={() => setCategory(item.id)}
              >
                <Text 
                  style={[
                    styles.categoryButtonText,
                    category === item.id && styles.categoryButtonTextActive
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Apply Settings</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  paramValue: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#FF5722',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
  },
  categoryButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TourParametersScreen;
