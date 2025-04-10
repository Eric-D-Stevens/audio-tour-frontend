import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Image,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TourContext } from '../../App';
import { PRESET_CITIES } from '../constants/cities';

const GuestTourParametersScreen = ({ navigation }) => {
  const { guestTourParams, setGuestTourParams } = useContext(TourContext);
  
  // Local state to track changes before saving
  const [selectedCity, setSelectedCity] = useState(guestTourParams.cityId || PRESET_CITIES[0].id);
  const [category, setCategory] = useState(guestTourParams.category || 'history');
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  
  // Tour types that match the backend geolocation lambda
  const categories = [
    { id: 'history', name: 'History' },
    { id: 'cultural', name: 'Cultural' },
    { id: 'art', name: 'Art' },
    { id: 'nature', name: 'Nature' },
    { id: 'architecture', name: 'Architecture' }
  ];
  
  const handleSave = () => {
    // Update the global guest tour parameters
    setGuestTourParams({
      cityId: selectedCity,
      category
    });
    
    // Show sign-in prompt
    setShowSignInPrompt(true);
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
        <Text style={styles.headerTitle}>Preview Tour Settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#FF5722" />
          <Text style={styles.previewBannerText}>
            You are in preview mode. Sign in for full access to personalized tours.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a City</Text>
          <Text style={styles.sectionDescription}>Choose a city to explore in guest mode</Text>
          
          <FlatList
            data={PRESET_CITIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            style={styles.cityList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCity(item.id)}
                style={[styles.cityCard, selectedCity === item.id && styles.cityCardSelected]}
              >
                <Image 
                  source={item.image}
                  style={styles.cityImage}
                  resizeMode="cover"
                />
                <View style={styles.cityOverlay} />
                <View style={styles.cityTextContainer}>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.cityCountry}>{item.country}</Text>
                </View>
                {selectedCity === item.id && (
                  <View style={styles.citySelectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#FF5722" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
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
      
      {/* Sign In Prompt Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSignInPrompt}
        onRequestClose={() => setShowSignInPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview Limitations</Text>
              <TouchableOpacity onPress={() => setShowSignInPrompt(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              Your tour settings have been applied, but in preview mode, you'll only have access to a limited selection of pre-recorded tours.
            </Text>
            
            <Text style={styles.modalText}>
              Sign in to unlock AI-generated personalized tours based on your preferences.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setShowSignInPrompt(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>Continue in Preview</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowSignInPrompt(false);
                  navigation.navigate('Auth');
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  cityList: {
    marginTop: 15,
    marginBottom: 5,
  },
  cityCard: {
    width: 160,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityCardSelected: {
    borderColor: '#FF5722',
  },
  cityImage: {
    width: '100%',
    height: '100%',
  },
  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cityTextContainer: {
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
  },
  cityName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cityCountry: {
    color: 'white',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  citySelectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  previewBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#FF5722',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalPrimaryButton: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSecondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalSecondaryButtonText: {
    color: '#333',
    fontSize: 16,
  },
});

export default GuestTourParametersScreen;
