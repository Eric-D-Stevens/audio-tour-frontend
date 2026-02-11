import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import logger from '../../../utils/logger';

/**
 * iOS Marker Component
 * Self-contained marker with custom circular pin view.
 * Uses bottom sheet for place details instead of callout.
 * 
 * Props:
 *   - point: { id, title, coordinate, ... } — the place data
 *   - onPress: (point) => void — called when the marker is tapped
 *   - selected: boolean — visual feedback when active
 */
const IOSMarker = ({ point, onPress, selected = false }) => {
  return (
    <Marker
      key={point.id}
      coordinate={point.coordinate}
      tracksViewChanges={selected}
      onPress={() => {
        logger.debug(`Marker onPress fired for: ${point.title}, platform: ios`);
        onPress(point);
      }}
    >
      {selected ? (
        <View style={styles.pinSelected}>
          <Ionicons name="location" size={20} color="#fff" />
        </View>
      ) : (
        <View style={styles.pin}>
          <Ionicons name="location" size={20} color="#FF5722" />
        </View>
      )}
      <Callout tooltip>
        <View style={{ width: 0, height: 0 }} />
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  pinSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    borderWidth: 2,
    borderColor: '#FF5722',
  },
});

export default IOSMarker;
