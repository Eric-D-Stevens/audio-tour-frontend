import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import audioManager from '../services/audioManager';
import { useTheme } from '../contexts';

const MiniAudioPlayer = ({ targetScreen = 'Audio' }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: colors.background, 
      borderRadius: 25, 
      paddingVertical: 4, 
      paddingHorizontal: 10, 
      shadowColor: colors.shadowColor, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.2, 
      shadowRadius: 3, 
      elevation: 3,
      zIndex: 200
    },
    placeName: { 
      fontSize: 14, 
      fontWeight: '500', 
      color: colors.text, 
      marginRight: 10, 
      maxWidth: 120 
    },
  };

  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const slideAnim = new Animated.Value(100); // Start from below the screen

  useEffect(() => {
    const unsubscribe = audioManager.subscribe((status) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying || false);
        setPlaceName(audioManager.currentPlaceName || 'Audio Tour');
        
        if (!isVisible) {
          setIsVisible(true);
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else if (!status.isLoaded && isVisible) {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setIsVisible(false));
      }
    });

    return () => unsubscribe();
  }, [isVisible]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await audioManager.pause();
    } else {
      await audioManager.play();
    }
  };

  const navigateToAudioScreen = () => {
    if (audioManager.currentPlaceId) {
      navigation.navigate(targetScreen, {
        place: {
          place_id: audioManager.currentPlaceId,
          name: audioManager.currentPlaceName,
        },
      });
    }
  };

  return (
    <>
      <View style={dynamicStyles.container}>
        {isVisible ? (
          // Audio is loaded, show player controls
          <>
            <View style={styles.leftControls}>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={togglePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              <View style={styles.titleSection}>
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={navigateToAudioScreen}
                >
                  <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={navigateToAudioScreen}
                  style={styles.textButton}
                >
                  <Text style={dynamicStyles.placeName} numberOfLines={1}>
                    {placeName}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // No audio loaded, show default play button
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={() => setShowModal(true)}
          >
            <Ionicons 
              name="play" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Your Audio Tour</Text>
            <Text style={styles.modalText}>
              Tap on any marker on the map to discover audio tours for nearby attractions.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 16,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  textButton: {
    flex: 1,
    marginLeft: 8,
  },
  placeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 2,
  },
});

export default MiniAudioPlayer;
