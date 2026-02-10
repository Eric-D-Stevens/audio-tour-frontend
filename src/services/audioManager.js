import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import logger from '../utils/logger';
import { CDN_ACCESS_KEY, CDN_ACCESS_HEADER } from '../constants/config';

class AudioManager {
  static instance = null;
  currentPlaceId = null;
  currentPlaceName = null;
  subscribers = new Set();
  isSetup = false;
  progressInterval = null;
  player = null;
  artworkUri = null;

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async setupPlayer() {
    if (this.isSetup) return;

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });

      // Pre-load artwork asset for lock screen
      try {
        const asset = Asset.fromModule(require('../../assets/app-store-icon.png'));
        await asset.downloadAsync();
        this.artworkUri = asset.localUri;
        logger.debug('Lock screen artwork loaded:', this.artworkUri);
      } catch (e) {
        logger.error('Failed to load lock screen artwork:', e);
      }

      this.isSetup = true;
      logger.debug('Audio player setup complete');

      // Start progress monitoring
      this.startProgressMonitoring();
    } catch (error) {
      logger.error('Error setting up audio player:', error);
    }
  }

  startProgressMonitoring() {
    // Clear any existing interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    // Poll for progress updates to notify subscribers
    this.progressInterval = setInterval(() => {
      try {
        if (!this.player) return;

        const status = {
          isLoaded: this.player.isLoaded,
          isPlaying: this.player.playing,
          isBuffering: this.player.isBuffering,
          isLoading: this.player.isBuffering,
          positionMillis: this.player.currentTime * 1000,
          durationMillis: this.player.duration * 1000,
          playableDurationMillis: this.player.duration * 1000,
          didJustFinish: false,
        };

        this.notifySubscribers(status);
      } catch (error) {
        // Player not ready yet, ignore
      }
    }, 500);
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
      // Setup player if not already done
      await this.setupPlayer();

      // If we're already playing this audio, don't reload it
      if (this.currentPlaceId === placeId && this.player) {
        return;
      }

      this.currentPlaceName = placeName;
      this.currentPlaceId = placeId;

      // Remove old player if it exists
      if (this.player) {
        try {
          this.player.remove();
        } catch (e) {
          // ignore cleanup errors
        }
      }

      // Create a new player with the audio source
      this.player = createAudioPlayer({
        uri: uri,
        headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY },
      });

      // Set up lock screen controls
      this.player.setActiveForLockScreen(
        true,
        {
          title: placeName || 'Audio Tour',
          artist: 'TensorTours',
          artworkUrl: this.artworkUri,
        },
        {
          showSeekForward: true,
          showSeekBackward: true,
        }
      );

      logger.debug('Audio loaded:', placeName);
    } catch (error) {
      logger.error('Error loading audio:', error);
      throw error;
    }
  }

  async play() {
    try {
      if (this.player) {
        this.player.play();
      }
    } catch (error) {
      logger.error('Error playing audio:', error);
    }
  }

  async pause() {
    try {
      if (this.player) {
        this.player.pause();
      }
    } catch (error) {
      logger.error('Error pausing audio:', error);
    }
  }

  async seekTo(positionMillis) {
    try {
      if (this.player) {
        // expo-audio seekTo uses seconds
        await this.player.seekTo(positionMillis / 1000);
      }
    } catch (error) {
      logger.error('Error seeking:', error);
    }
  }

  async getStatus() {
    try {
      if (!this.player) return null;

      return {
        isLoaded: this.player.isLoaded,
        isPlaying: this.player.playing,
        isBuffering: this.player.isBuffering,
        isLoading: this.player.isBuffering,
        positionMillis: this.player.currentTime * 1000,
        durationMillis: this.player.duration * 1000,
        playableDurationMillis: this.player.duration * 1000,
        didJustFinish: false,
      };
    } catch (error) {
      return null;
    }
  }

  async unloadAudio() {
    try {
      if (this.player) {
        this.player.remove();
        this.player = null;
      }
      this.currentPlaceId = null;
      this.currentPlaceName = null;
    } catch (error) {
      logger.error('Error unloading audio:', error);
    }
  }

  destroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.player) {
      this.player.remove();
      this.player = null;
    }
  }
}

export default AudioManager.getInstance();
