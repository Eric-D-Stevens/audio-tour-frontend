import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { fetchPreviewTour } from '../services/api.ts';
import audioManager from '../services/audioManager';
import { TourContext, useTheme } from '../contexts';
import logger from '../utils/logger';

const GuestAudioPlayer = ({ placeId, tourType = 'history' }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { backgroundColor: colors.card, borderRadius: 10, padding: 20, elevation: 4, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, alignItems: 'center', justifyContent: 'center' },
    tourTypeTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 15 },
    timeText: { fontSize: 12, color: colors.textSecondary, width: 45, textAlign: 'center' },
    loadingText: { marginTop: 10, color: colors.textSecondary },
    errorText: { marginTop: 10, color: colors.error, textAlign: 'center' },
    controlIconColor: colors.textSecondary,
  };

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
      
      logger.debug(`Loading preview audio tour for place: ${placeId}, type: ${tourType}`);
      
      // Fetch preview audio data from the API using the new function
      const data = await fetchPreviewTour(placeId, tourType);
      logger.debug(`Preview tour data received for ${placeId}`); // Remove JSON.stringify to avoid large data dumps
      
      // Save the full audio data to state
      setAudioData(data);
      
      // The API response structure has changed - audio URL is now at tour.audio.cloudfront_url
      if (!data || !data.tour || !data.tour.audio || !data.tour.audio.cloudfront_url) {
        logger.error('No audio URL in response, unexpected structure');
        throw new Error('No audio available for this location');
      }
      
      // Get audio URL from the correct path
      const audioUrl = data.tour.audio.cloudfront_url;
      logger.debug(`Found audio URL: ${audioUrl}`);

      // Extract the place name from the tour data
      const placeName = data.tour?.place_info?.place_name || 'Audio Tour';
      
      // Load the audio file into the audio manager
      logger.debug(`Loading audio file: ${audioUrl}`);
      await audioManager.loadAudio(audioUrl, placeId, placeName);
      
      // Get initial audio playback status
      const status = await audioManager.getStatus();
      if (status) {
        onPlaybackStatusUpdate(status);
      }
      
    } catch (err) {
      logger.error('Error loading audio data:', err);
      setError('Failed to load audio tour: ' + (err.message || 'Unknown error'));
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
      <View style={dynamicStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading tour audio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={dynamicStyles.container}>
        <Ionicons name="alert-circle" size={50} color={colors.error} />
        <Text style={dynamicStyles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAudioData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {audioData && (
        <>
          <Text style={dynamicStyles.tourTypeTitle}>
            {tourType.charAt(0).toUpperCase() + tourType.slice(1)} Tour
          </Text>
          
          <View style={styles.sliderContainer}>
            <Text style={dynamicStyles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={seekTo}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={dynamicStyles.timeText}>{formatTime(duration)}</Text>
          </View>
          
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={restart}>
              <Ionicons name="refresh" size={24} color={dynamicStyles.controlIconColor} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={rewind}>
              <Ionicons name="play-back" size={24} color={dynamicStyles.controlIconColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: colors.primary }]} 
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={forward}>
              <Ionicons name="play-forward" size={24} color={dynamicStyles.controlIconColor} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={() => {/* Volume control */}}>
              <Ionicons name="volume-medium" size={24} color={dynamicStyles.controlIconColor} />
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
