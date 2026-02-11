import React, { useRef } from 'react';
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
  if (!selectedPlace || !bottomSheetAnim) return null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
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
        <CalloutTitle title={selectedPlace.title} colors={colors} />
        <CalloutDescription
          description={selectedPlace.description}
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
            onPress={onStartTour}
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
