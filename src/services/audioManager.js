import { Audio } from 'expo-av';

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
      });

      // Load the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate
      );

      this.sound = newSound;
      this.currentPlaceId = placeId;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  onPlaybackStatusUpdate = (status) => {
    this.notifySubscribers(status);
  }

  async play() {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
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
    }
  }
}

export default AudioManager.getInstance();
