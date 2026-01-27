import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';

const MAX_DISTANCE = 8000; // Maximum search distance in meters

const SearchResultToast = ({ 
  visible, 
  placesCount, 
  currentDistance, 
  tourType,
  onHide 
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, slideAnim, onHide]);

  if (!visible) return null;

  // Determine message based on results
  const getMessage = () => {
    if (placesCount > 0) {
      return {
        icon: 'checkmark-circle',
        iconColor: '#4CAF50',
        title: `Found ${placesCount} ${placesCount === 1 ? 'place' : 'places'}`,
        subtitle: 'Tap a marker to start your audio tour',
      };
    }

    // No places found
    const isAtMaxDistance = currentDistance >= MAX_DISTANCE;
    
    if (isAtMaxDistance) {
      return {
        icon: 'location-outline',
        iconColor: '#FF9800',
        title: 'No attractions found nearby',
        subtitle: `Try a different tour type or move to a new location`,
      };
    } else {
      // Convert current distance to miles for display
      const currentMiles = (currentDistance * 0.000621371).toFixed(1);
      const maxMiles = (MAX_DISTANCE * 0.000621371).toFixed(1);
      return {
        icon: 'expand-outline',
        iconColor: '#FF9800',
        title: 'No attractions found',
        subtitle: `Try increasing your search radius (currently ${currentMiles} mi, max ${maxMiles} mi)`,
      };
    }
  };

  const message = getMessage();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={message.icon} size={24} color={message.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{message.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{message.subtitle}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
});

export default SearchResultToast;
