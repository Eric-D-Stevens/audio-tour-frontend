import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { fetchPreviewAudioTour } from '../services/api';
import audioManager from '../services/audioManager';

const GuestAudioPlayer = ({ placeId, tourType = 'history' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState(null);

  // Load audio data on component mount
  useEffect(() => {
    loadAudioData();
    
    // Subscribe to audio status updates
    const unsubscribe = audioManager.subscribe(onPlaybackStatusUpdate);
    
    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [placeId, tourType]);

  // Load audio data from API
  const loadAudioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch preview audio data from the API
      const data = await fetchPreviewAudioTour(placeId, tourType);
      setAudioData(data);
      
      if (!data.audio_url) {
        throw new Error('No audio available for this location');
      }

      // Load the audio file
      const placeName = typeof data.place_details?.name === 'object'
        ? data.place_details?.name?.text
        : data.place_details?.name;
      await audioManager.loadAudio(data.audio_url, placeId, placeName);
      
      // Get initial status
      const status = await audioManager.getStatus();
      if (status) {
        onPlaybackStatusUpdate(status);
      }
      
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio tour');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
      setIsLoading(status.isLoading || false);
    }
  };

  // Play/pause toggle
  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await audioManager.pause();
      } else {
        await audioManager.play();
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      setError('Failed to control playback');
    }
  };

  // Seek to position
  const seekTo = async (value) => {
    try {
      await audioManager.seekTo(value);
    } catch (err) {
      console.error('Error seeking:', err);
      setError('Failed to seek');
    }
  };

  // Format time in mm:ss
  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <View style={styles.controls}>
            <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="#333" 
              />
            </TouchableOpacity>
            
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onSlidingComplete={seekTo}
                minimumTrackTintColor="#333"
                maximumTrackTintColor="#999"
                thumbTintColor="#333"
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
          
          {audioData?.place_details?.name && (
            <Text style={styles.title}>
              {typeof audioData.place_details.name === 'object'
                ? audioData.place_details.name.text
                : audioData.place_details.name}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playButton: {
    marginRight: 15,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 5,
  },
  errorText: {
    color: '#FF5722',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default GuestAudioPlayer;
