/**
 * Map Components - Platform-specific implementations for markers and callouts
 * 
 * This module provides platform-specific components to handle differences
 * between iOS and Android in react-native-maps.
 * 
 * iOS: Custom markers and tooltip callouts work reliably
 * Android: Native pin markers and bottom sheet callouts avoid rendering issues
 * 
 * Exports:
 *   - PlatformMarker, IOSMarker, AndroidMarker from './markers'
 *   - PlatformCallout, IOSCallout, AndroidCallout from './callouts'
 *   - useAndroidMarkerHandler hook for managing Android bottom sheet state
 */

export { 
  default as PlatformMarker, 
  IOSMarker, 
  AndroidMarker 
} from './markers';

export { 
  default as PlatformCallout, 
  IOSCallout, 
  AndroidCallout 
} from './callouts';

export { 
  default as useAndroidMarkerHandler 
} from './hooks/useAndroidMarkerHandler';
