import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  PanResponder,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tourCache } from '../../../services/tourCache';
import { CDN_ACCESS_KEY, CDN_ACCESS_HEADER } from '../../../constants/config';

/**
 * Bottom Sheet Component
 *
 * Slide-up bottom sheet for both iOS and Android.
 * Uses both shadow (iOS) and elevation (Android) styles.
 * Supports swipe-down gesture to close.
 * Supports slide-down/slide-up swap animation when switching places.
 */
const Sheet = ({
  selectedPlace,
  bottomSheetAnim,
  onClose,
  onStartTour,
  colors = {},
  buttonText = 'Start Tour',
  closeText = 'Close',
  tourType = 'history',
}) => {
  const [displayedPlace, setDisplayedPlace] = useState(selectedPlace);
  const [isSwapping, setIsSwapping] = useState(false);
  const prevPlaceRef = useRef(null);

  // Handle swap animation when selectedPlace changes
  useEffect(() => {
    if (!selectedPlace) {
      setDisplayedPlace(null);
      prevPlaceRef.current = null;
      return;
    }

    const currentId = selectedPlace.id;
    const prevId = prevPlaceRef.current;

    // First open or same place - just display
    if (!prevId || currentId === prevId) {
      setDisplayedPlace(selectedPlace);
      prevPlaceRef.current = currentId;
      return;
    }

    // Different place selected - do swap animation
    if (currentId !== prevId && !isSwapping) {
      setIsSwapping(true);
      
      // Slide current sheet down
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Swap content
        setDisplayedPlace(selectedPlace);
        prevPlaceRef.current = currentId;
        
        // Slide new sheet up with spring
        Animated.spring(bottomSheetAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start(() => {
          setIsSwapping(false);
        });
      });
    }
  }, [selectedPlace, bottomSheetAnim, isSwapping]);

  if (!displayedPlace || !bottomSheetAnim) return null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwapping,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isSwapping && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const newValue = 1 - gestureState.dy / 300;
          bottomSheetAnim.setValue(Math.max(0, newValue));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(bottomSheetAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        {
          backgroundColor: colors.card || 'white',
        },
        {
          transform: [
            {
              translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 30],
              }),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />
      <View style={styles.sheetContent}>
        <View style={styles.topRow}>
          <View style={styles.textArea}>
            <Text style={[styles.title, { color: colors.text || '#1a1a1a' }]} numberOfLines={1}>
              {displayedPlace.title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary || '#666' }]} numberOfLines={2}>
              {displayedPlace.description}
            </Text>
          </View>
          {(() => {
            const placeId = displayedPlace.id || displayedPlace.originalData?.place_id;
            const cached = placeId ? tourCache.get(placeId, tourType) : null;
            const photoUrl = cached?.tour?.photos?.[0]?.cloudfront_url;
            if (photoUrl) {
              return (
                <Image
                  key={placeId}
                  source={{ uri: photoUrl, headers: { [CDN_ACCESS_HEADER]: CDN_ACCESS_KEY } }}
                  style={styles.thumbnailImage}
                />
              );
            }
            return (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.border || '#e5e5e5' }]}>
                <Ionicons name="image-outline" size={28} color={colors.textSecondary || '#999'} />
              </View>
            );
          })()}
        </View>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => onStartTour(displayedPlace)}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>{buttonText}</Text>
          <Ionicons name="play" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  textArea: {
    flex: 1,
    marginRight: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Sheet;
