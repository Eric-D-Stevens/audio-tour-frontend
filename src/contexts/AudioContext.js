import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import audioManager from '../services/audioManager';
import logger from '../utils/logger';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // Subscribe to audio status updates
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((status) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying || false);
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        setIsLoading(status.isLoading || false);
      } else {
        setIsPlaying(false);
        setIsLoading(status.isLoading || false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadTrack = useCallback(async (uri, placeId, placeName) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await audioManager.loadAudio(uri, placeId, placeName);
      setCurrentTrack({ placeId, placeName, uri });
      
      logger.debug('Audio track loaded:', placeName);
    } catch (err) {
      logger.error('Failed to load audio track:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const play = useCallback(async () => {
    try {
      await audioManager.play();
    } catch (err) {
      logger.error('Failed to play audio:', err);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await audioManager.pause();
    } catch (err) {
      logger.error('Failed to pause audio:', err);
    }
  }, []);

  const seekTo = useCallback(async (positionMillis) => {
    try {
      await audioManager.seekTo(positionMillis);
    } catch (err) {
      logger.error('Failed to seek audio:', err);
    }
  }, []);

  const unload = useCallback(async () => {
    try {
      await audioManager.unloadAudio();
      setCurrentTrack(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    } catch (err) {
      logger.error('Failed to unload audio:', err);
    }
  }, []);

  const value = {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    error,
    loadTrack,
    play,
    pause,
    seekTo,
    unload,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
