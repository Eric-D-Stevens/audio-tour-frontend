import { Platform } from 'react-native';
import IOSMarker from './IOSMarker';
import AndroidMarker from './AndroidMarker';

/**
 * Platform-specific Marker component
 * 
 * Both iOS and Android markers are self-contained, wrapping react-native-maps
 * Marker with platform-appropriate styling and callbacks.
 * 
 * Props:
 *   - point: { id, title, coordinate, ... } — the place data
 *   - onPress: (point) => void — called when the marker is tapped
 * 
 * Usage:
 *   import PlatformMarker from './components/map/markers';
 *   
 *   <PlatformMarker point={point} onPress={handleMarkerPress} />
 */
const PlatformMarker = Platform.select({
  ios: IOSMarker,
  android: AndroidMarker,
  default: IOSMarker,
});

export default PlatformMarker;
export { IOSMarker, AndroidMarker };
