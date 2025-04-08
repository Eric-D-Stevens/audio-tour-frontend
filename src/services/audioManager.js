import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class AudioManager {
  static instance = null;
  sound = null;
  currentPlaceId = null;
  currentPlaceName = null;
  subscribers = new Set();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(status) {
    this.subscribers.forEach(callback => callback(status));
  }

  async loadAudio(uri, placeId, placeName = '') {
    try {
      // If we're already playing this audio, don't reload it
      if (this.currentPlaceId === placeId && this.sound) {
        return;
      }

      this.currentPlaceName = placeName;

      // Unload any existing sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });

      // Load the new sound with metadata for lock screen
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 1000,
          positionMillis: 0,
          // Add metadata for lock screen controls
          androidImplementation: 'MediaPlayer',
        },
        this.onPlaybackStatusUpdate
      );
      
      // Set metadata for lock screen display
      await newSound.setStatusAsync({
        progressUpdateIntervalMillis: 1000,
        androidImplementation: 'MediaPlayer',
      });
      
      // Set metadata for iOS and Android
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        });
      }

      this.sound = newSound;
      this.currentPlaceId = placeId;
      
      // Set playback status metadata for lock screen
      this.updateNowPlayingInfo();
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  onPlaybackStatusUpdate = (status) => {
    this.notifySubscribers(status);
    
    // Update lock screen controls whenever playback status changes
    if (status.isLoaded) {
      this.updateNowPlayingInfo(status);
    }
  }

  async play() {
    if (this.sound) {
      await this.sound.playAsync();
      this.updateNowPlayingInfo();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.updateNowPlayingInfo();
    }
  }

  async seekTo(position) {
    if (this.sound) {
      await this.sound.setPositionAsync(position);
    }
  }

  async getStatus() {
    if (this.sound) {
      return await this.sound.getStatusAsync();
    }
    return null;
  }

  async unloadAudio() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      this.currentPlaceId = null;
      this.currentPlaceName = null;
      
      // Clear lock screen controls
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
        });
      }
    }
  }
  
  // Update metadata for lock screen controls
  async updateNowPlayingInfo(status) {
    if (!this.sound || !this.currentPlaceName) return;
    
    try {
      // If status wasn't passed, get it
      if (!status) {
        status = await this.sound.getStatusAsync();
      }
      
      // Set metadata for lock screen
      await this.sound.setStatusAsync({
        androidImplementation: 'MediaPlayer',
        progressUpdateIntervalMillis: 1000,
      });
      
      // Update metadata for iOS
      if (Platform.OS === 'ios') {
        const albumArt = 'https://tensortours.com/logo.png'; // Replace with your app logo or tour image
        
        // Set now playing info for iOS
        await this.sound._setNowPlayingInfo({
          title: this.currentPlaceName || 'Audio Tour',
          artist: 'TensorTours',
          album: 'AI-Generated Audio Tour',
          artwork: albumArt,
          duration: status.durationMillis / 1000, // in seconds
          elapsedTime: status.positionMillis / 1000, // in seconds
          // Add these options to show controls
          isLiveStream: false,
          playbackRate: 1.0,
        });
      }
    } catch (error) {
      console.error('Error updating now playing info:', error);
    }
  }
}



export default AudioManager.getInstance();
