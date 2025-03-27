import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { fetchAudioTour } from '../services/api';

const AudioPlayer = ({ placeId, tourType = 'history' }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState(null);

  // Load audio data on component mount
  useEffect(() => {
    loadAudioData();
    
    // Cleanup function
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [placeId, tourType]);

  // Position update interval
  useEffect(() => {
    let interval;
    
    if (isPlaying) {
      interval = setInterval(updatePosition, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, sound]);

  // Load audio data from API
  const loadAudioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch audio data from the API
      const data = await fetchAudioTour(placeId, tourType);
      setAudioData(data);
      
      // Load the audio file
      await loadAudio(data.audio_url);
      
    } catch (err) {
      setError('Failed to load audio tour: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load and set up audio file
  const loadAudio = async (uri) => {
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Load the sound file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
    } catch (err) {
      setError('Failed to load audio file: ' + err.message);
    }
  };

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  // Update the current position
  const updatePosition = async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPosition(status.positionMillis);
      }
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek to a specific position
  const seekTo = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  // Format time in MM:SS
  const formatTime = (millis) => {
    if (!millis) return '00:00';
    
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Restart audio
  const restart = async () => {
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  // Forward 10 seconds
  const forward = async () => {
    if (sound) {
      const newPosition = Math.min(position + 10000, duration);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    }
  };

  // Rewind 10 seconds
  const rewind = async () => {
    if (sound) {
      const newPosition = Math.max(0, position - 10000);
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading audio tour...</Text>
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
            <Text style={styles.title}>{audioData.place_details?.name || 'Audio Tour'}</Text>
            {audioData.cached && <Text style={styles.cachedBadge}>Cached</Text>}
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={seekTo}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCCCCC"
              thumbTintColor="#007AFF"
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
            
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cachedBadge: {
    fontSize: 12,
    backgroundColor: '#E3F2FD',
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AudioPlayer;