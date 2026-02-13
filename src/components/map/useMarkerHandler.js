import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

/**
 * iOS Marker Handler Hook
 *
 * Manages marker selection and bottom sheet animation for iOS.
 * Now uses bottom sheet style (matching Android) instead of callouts.
 */
export const useMarkerHandler = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  const handleMarkerPress = useCallback((place) => {
    setSelectedPlace(place);
    setSheetOpen(true);
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [bottomSheetAnim]);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
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
    sheetOpen,
  };
};

export default useMarkerHandler;
