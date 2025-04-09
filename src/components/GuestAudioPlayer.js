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

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (isPlaying) {
      await audioManager.pause();
    } else {
      await audioManager.play();
    }
  };

  // Seek to a specific position
  const seekTo = async (value) => {
    await audioManager.seekTo(value);
  };

  // Restart audio
  const restart = async () => {
    await audioManager.seekTo(0);
    await audioManager.play();
  };

  // Forward 10 seconds
  const forward = async () => {
    const newPosition = Math.min(position + 10000, duration);
    await audioManager.seekTo(newPosition);
  };

  // Rewind 10 seconds
  const rewind = async () => {
    const newPosition = Math.max(0, position - 10000);
    await audioManager.seekTo(newPosition);
  };



  // Format time in MM:SS
  const formatTime = (millis) => {
    if (!millis) return '00:00';
    
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Generating AI-powered tour from scratch, this may take a few seconds...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAudioData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {audioData && (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              <Text 
                style={styles.title} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {typeof audioData.place_details?.name === 'object' 
                  ? audioData.place_details?.name?.text || 'Audio Tour'
                  : audioData.place_details?.name || 'Audio Tour'
                }
              </Text>
              <Text style={styles.previewBadge}>Preview</Text>
            </View>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={seekTo}
              minimumTrackTintColor="#FF5722"
              maximumTrackTintColor="#CCCCCC"
              thumbTintColor="#FF5722"
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={restart}>
              <Ionicons name="refresh" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={rewind}>
              <Ionicons name="play-back" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: '#FF5722' }]} 
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={forward}>
              <Ionicons name="play-forward" size={24} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={() => {/* Volume control */}}>
              <Ionicons name="volume-medium" size={24} color="#555" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1,
    marginRight: 5,
  },
  previewBadge: {
    fontSize: 12,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    color: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    width: 45,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    backgroundColor: '#FF5722',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GuestAudioPlayer;
