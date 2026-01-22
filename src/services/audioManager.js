import TrackPlayer, {
  Capability,
  State,
  Event,
  useProgress,
  usePlaybackState,
} from 'react-native-track-player';
import logger from '../utils/logger';
import { CDN_ACCESS_KEY, CDN_ACCESS_HEADER } from '../constants/config';

class AudioManager {
  static instance = null;
  currentPlaceId = null;
  currentPlaceName = null;
  subscribers = new Set();
  isSetup = false;
  progressInterval = null;

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async setupPlayer() {
    if (this.isSetup) return;

    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        forwardJumpInterval: 15,
        backwardJumpInterval: 15,
        progressUpdateEventInterval: 1,
      });

      this.isSetup = true;
      logger.debug('TrackPlayer setup complete');

      // Start progress monitoring
      this.startProgressMonitoring();
    } catch (error) {
      // Player might already be setup
      if (error.message?.includes('already been initialized')) {
        this.isSetup = true;
        this.startProgressMonitoring();
      } else {
        logger.error('Error setting up TrackPlayer:', error);
      }
    }
  }

  startProgressMonitoring() {
    // Clear any existing interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    // Poll for progress updates to notify subscribers
    this.progressInterval = setInterval(async () => {
      try {
        const state = await TrackPlayer.getPlaybackState();
        const position = await TrackPlayer.getPosition();
        const duration = await TrackPlayer.getDuration();
        const buffered = await TrackPlayer.getBufferedPosition();

        const isBuffering = state.state === State.Buffering || state.state === State.Loading;
        const status = {
          isLoaded: true,
          isPlaying: state.state === State.Playing,
          isBuffering: isBuffering,
          isLoading: isBuffering, // Alias for backwards compatibility
          positionMillis: position * 1000,
          durationMillis: duration * 1000,
          playableDurationMillis: buffered * 1000,
          didJustFinish: state.state === State.Ended,
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
      if (this.currentPlaceId === placeId) {
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) {
          return;
        }
      }

      this.currentPlaceName = placeName;
      this.currentPlaceId = placeId;

      // Reset the player
      await TrackPlayer.reset();

      // Add the track with CDN headers and artwork
      await TrackPlayer.add({
        id: placeId,
        url: uri,
        title: placeName || 'Audio Tour',
        artist: 'TensorTours',
        artwork: require('../../assets/app-store-icon.png'),
        headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY },
      });

      logger.debug('Audio loaded:', placeName);
    } catch (error) {
      logger.error('Error loading audio:', error);
      throw error;
    }
  }

  async play() {
    try {
      await TrackPlayer.play();
    } catch (error) {
      logger.error('Error playing audio:', error);
    }
  }

  async pause() {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      logger.error('Error pausing audio:', error);
    }
  }

  async seekTo(positionMillis) {
    try {
      // TrackPlayer uses seconds, not milliseconds
      await TrackPlayer.seekTo(positionMillis / 1000);
    } catch (error) {
      logger.error('Error seeking:', error);
    }
  }

  async getStatus() {
    try {
      const state = await TrackPlayer.getPlaybackState();
      const position = await TrackPlayer.getPosition();
      const duration = await TrackPlayer.getDuration();
      const buffered = await TrackPlayer.getBufferedPosition();

      const isBuffering = state.state === State.Buffering || state.state === State.Loading;
      return {
        isLoaded: true,
        isPlaying: state.state === State.Playing,
        isBuffering: isBuffering,
        isLoading: isBuffering, // Alias for backwards compatibility
        positionMillis: position * 1000,
        durationMillis: duration * 1000,
        playableDurationMillis: buffered * 1000,
        didJustFinish: state.state === State.Ended,
      };
    } catch (error) {
      return null;
    }
  }

  async unloadAudio() {
    try {
      await TrackPlayer.reset();
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
  }
}



export default AudioManager.getInstance();
