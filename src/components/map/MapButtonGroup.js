import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';

/**
 * MapButtonGroup
 *
 * A floating vertical button stack on the right side of the map.
 * Animates up/down based on the `isOpen` boolean prop.
 * Does NOT follow the raw sheet animation — only reacts to
 * full open/close transitions (not sheet-to-sheet swaps).
 *
 * Rising: ease-out (decelerates to a stop)
 * Falling: ease-in (accelerates like gravity)
 */
const RISE_AMOUNT = 160;

const MapButtonGroup = ({ isOpen, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: isOpen ? 300 : 400,
      easing: isOpen ? Easing.out(Easing.quad) : Easing.bounce,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -RISE_AMOUNT],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 15,
    alignItems: 'center',
    gap: 10,
    zIndex: 50,
  },
});

export default MapButtonGroup;
