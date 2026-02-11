import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  PanResponder,
} from 'react-native';
import {
  CalloutTitle,
  CalloutDescription,
  CalloutButton,
  CalloutButtonRow,
} from '../CalloutContent';

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
        <CalloutTitle title={displayedPlace.title} colors={colors} />
        <CalloutDescription
          description={displayedPlace.description}
          colors={colors}
        />
        <CalloutButtonRow>
          <CalloutButton
            onPress={onClose}
            text={closeText}
            primary={false}
            colors={colors}
          />
          <CalloutButton
            onPress={() => onStartTour(displayedPlace)}
            text={buttonText}
            primary={true}
          />
        </CalloutButtonRow>
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
    paddingHorizontal: 20,
  },
});

export default Sheet;
