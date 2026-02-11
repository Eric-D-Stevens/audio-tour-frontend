import React from 'react';
import { Marker } from 'react-native-maps';
import logger from '../../../utils/logger';

/**
 * Android Marker Component
 * Uses the default marker with pinColor for reliability on Android.
 * 
 * Props:
 *   - point: { id, title, coordinate, ... } — the place data
 *   - onPress: (point) => void — called when the marker is tapped
 *   - selected: boolean — visual feedback when active (uses different pin color)
 */
const AndroidMarker = ({ point, onPress, selected = false }) => {
  return (
    <Marker
      key={point.id}
      coordinate={point.coordinate}
      pinColor={selected ? '#D84315' : '#FF5722'}
      onPress={() => {
        logger.debug(`Marker onPress fired for: ${point.title}, platform: android`);
        onPress(point);
      }}
    />
  );
};

export default AndroidMarker;
