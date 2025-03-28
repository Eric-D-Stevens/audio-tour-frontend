import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AudioScreen = ({ route, navigation }) => {
  const { tourId } = route.params || { tourId: '1' };
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes in seconds
  
  // Mock tour data - in a real app, this would come from an API
  const tourData = {
    '1': {
      title: 'Golden Gate Bridge Tour',
      description: 'Discover the history and engineering marvel of the Golden Gate Bridge, one of the most iconic landmarks in San Francisco.',
      image: 'https://example.com/golden-gate.jpg',
      duration: '3:00',
    },
    '2': {
      title: 'Fisherman\'s Wharf Experience',
      description: 'Explore the vibrant atmosphere of Fisherman\'s Wharf, from its historic fishing fleet to its famous sea lions and delicious seafood.',
      image: 'https://example.com/fishermans-wharf.jpg',
      duration: '2:45',
    },
    '3': {
      title: 'Alcatraz Island History',
      description: 'Learn about the fascinating and sometimes dark history of Alcatraz Island, home to the infamous federal penitentiary that housed some of America\'s most notorious criminals.',
      image: 'https://example.com/alcatraz.jpg',
      duration: '4:30',
    },
  };
  
  const tour = tourData[tourId] || tourData['1'];
  
  useEffect(() => {
    // Simulate audio progress
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, duration]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const progress = (currentTime / duration) * 100;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tour.title}</Text>
        </View>
        
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Tour Image</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.tourTitle}>{tour.title}</Text>
          <Text style={styles.tourDescription}>{tour.description}</Text>
          
          <View style={styles.audioPlayer}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{tour.duration}</Text>
            </View>
            
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={24} color="#333" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  contentContainer: {
    padding: 20,
  },
  tourTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tourDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  audioPlayer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeText: {
    color: '#666',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
});

export default AudioScreen;
