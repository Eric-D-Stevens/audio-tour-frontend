import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * Android Marker Handler Hook
 * 
 * Manages the bottom sheet state and animations for Android marker interactions.
 * On Android, react-native-maps Callout has rendering issues, so we use a
 * slide-up bottom sheet instead.
 */
export const useMarkerHandler = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  const handleMarkerPress = useCallback((place) => {
    setSelectedPlace(place);
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [bottomSheetAnim]);

  const handleClose = useCallback(() => {
    Animated.timing(bottomSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPlace(null);
    });
  }, [bottomSheetAnim]);

  return {
    selectedPlace,
    bottomSheetAnim,
    handleMarkerPress,
    handleClose,
    isVisible: selectedPlace !== null,
  };
};

export default useMarkerHandler;
