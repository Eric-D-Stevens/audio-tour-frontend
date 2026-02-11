import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';
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
  appStateListener = null;

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

      // Add app state listener for cleanup
      this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // TODO: Enable for later app setting to control background audio behavior
          // logger.debug('App going to background, pausing audio');
          // this.pause();
        }
      });
    } catch (error) {
      // Clean up interval if setup failed
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
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

  // Check if player is still healthy, if not clean it up
  checkPlayerHealth() {
    if (!this.player) return false;
    try {
      // Try to access a property - if it throws, player is dead
      const _ = this.player.id;
      return true;
    } catch (e) {
      logger.warn('Player appears to be crashed, cleaning up...');
      try {
        this.player.remove();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      this.player = null;
      return false;
    }
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

      // Check player health before using it
      const isHealthy = this.checkPlayerHealth();

      // Use replace() if player exists and is healthy, otherwise create new player
      if (isHealthy) {
        try {
          // Pause first to prevent auto-play, then replace the audio source
          this.player.pause();
          this.player.replace({
            uri: uri,
            headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY },
          });
        } catch (playerError) {
          logger.error('Player operation failed, recreating player:', playerError);
          // Clean up dead player
          try {
            this.player.remove();
          } catch (e) {
            // Ignore
          }
          this.player = null;
          // Create new player
          this.player = createAudioPlayer({
            uri: uri,
            headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY },
          });
        }
      } else {
        // Create player only once - this is the singleton instance
        this.player = createAudioPlayer({
          uri: uri,
          headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY },
        });
      }

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
      if (this.checkPlayerHealth()) {
        this.player.play();
      } else {
        logger.error('Cannot play: player is not healthy');
      }
    } catch (error) {
      logger.error('Error playing audio:', error);
      // Try to mark player as unhealthy
      this.player = null;
    }
  }

  async pause() {
    try {
      if (this.checkPlayerHealth()) {
        this.player.pause();
      }
    } catch (error) {
      logger.error('Error pausing audio:', error);
      this.player = null;
    }
  }

  async seekTo(positionMillis) {
    try {
      if (this.checkPlayerHealth()) {
        // expo-audio seekTo uses seconds
        await this.player.seekTo(positionMillis / 1000);
      }
    } catch (error) {
      logger.error('Error seeking:', error);
      this.player = null;
    }
  }

  async getStatus() {
    try {
      if (!this.checkPlayerHealth()) return null;

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
      this.player = null;
      return null;
    }
  }

  async unloadAudio() {
    try {
      if (this.player) {
        this.player.pause();
        // Don't remove the player - keep it for reuse
        // Just clear the current audio state
      }
      this.currentPlaceId = null;
      this.currentPlaceName = null;
    } catch (error) {
      logger.error('Error unloading audio:', error);
    }
  }

  destroy() {
    // Clear the interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    // Remove app state listener
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    // Clean up player
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }
    // Clear all subscribers
    this.subscribers.clear();
    // Reset state
    this.currentPlaceId = null;
    this.currentPlaceName = null;
    this.isSetup = false;
    logger.debug('Audio manager destroyed');
  }
}

export default AudioManager.getInstance();
