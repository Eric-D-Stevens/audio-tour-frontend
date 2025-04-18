import { API_BASE_URL } from '../constants/config';
import { getAuthToken } from './auth';

// Track in-flight requests to prevent duplicates
const pendingRequests = {};

/**
 * Base API request function with authentication
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication token if required
    if (requiresAuth) {
      try {
        // First try to get token from our storage
        // The getAuthToken now returns an object with {token, error} structure
        const authResult = await getAuthToken();
        
        if (authResult && authResult.token) {
          // For API Gateway with Cognito User Pools Authorizer
          headers['Authorization'] = authResult.token;
          console.log(`Using stored auth token, length: ${authResult.token.length}`);
        } else {
          const errorMsg = authResult?.error || 'No authentication token available';
          console.log(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (authError) {
        // For authenticated endpoints, we need to propagate the error
        console.error('Authentication error:', authError.message);
        throw new Error(`Authentication required: ${authError.message}`);
      }
    } else {
      // For guest endpoints, explicitly log that we're proceeding without auth
      console.log(`Proceeding with guest access for endpoint: ${endpoint}`);
    }

    // Simplified request logging
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle response errors
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API error response (${response.status}):`, errorText);
      
      // For 401 errors, try to provide more helpful information
      if (response.status === 401) {
        console.log('Authentication error detected. Token may be invalid or expired.');
        // Only attempt to refresh the token on auth errors for endpoints that require auth
        // This avoids unnecessary sign-out operations in guest mode
        if (requiresAuth) {
          try {
            // Clear stored tokens to force a fresh login on next attempt
            const { signOut } = await import('./auth');
            await signOut();
            console.log('User signed out due to authentication error');
          } catch (authError) {
            // Prevent auth errors from completely crashing the app
            console.error('Error during authentication cleanup:', authError);
          }
        } else {
          console.log('Authentication error on non-auth endpoint - continuing in guest mode');
        }
      }
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || errorJson.error || `Request failed with status ${response.status}`);
      } catch (e) {
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
    }

    // Parse JSON response
    const data = await response.json();
    
    // Log successful API response - simplified
    console.log(`API: ${endpoint} completed (${response.status})`);
    
    return data;
  } catch (error) {
    console.error(`API request error: ${error.message}`);
    throw error;
  }
};

/**
 * Fetch nearby places based on location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @param {number} maxResults - Maximum number of places to return
 * @returns {Promise<Object>} - Places data
 */
export const fetchNearbyPlaces = async (lat, lng, radius = 500, tourType = 'history', maxResults = 5) => {
  console.log(`fetchNearbyPlaces called with: lat=${lat}, lng=${lng}, radius=${radius}, tourType=${tourType}`);
  const endpoint = `/places?lat=${lat}&lng=${lng}&radius=${radius}&tour_type=${tourType}&max_results=${maxResults}`;
  const startTime = Date.now();
  
  try {
    const result = await apiRequest(endpoint, { method: 'GET' }, true);
    const duration = Date.now() - startTime;
    console.log(`fetchNearbyPlaces completed in ${duration}ms with ${result.places?.length || 0} places`);
    return result;
  } catch (error) {
    console.error(`fetchNearbyPlaces failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
};

/**
 * Fetch city preview data with debouncing to prevent duplicate calls
 * @param {string} city - City name
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - City preview data
 */
export const fetchCityPreview = async (city, tourType = 'history') => {
  const endpoint = `/preview/${encodeURIComponent(city)}?tour_type=${tourType}`;
  const cacheKey = `${city}-${tourType}`;
  const now = Date.now();
  
  // Check if there's already a pending request for this city/tour type
  if (pendingRequests[cacheKey]) {
    console.log(`Using in-flight request for ${city} (${tourType})`);
    return pendingRequests[cacheKey];
  }
  
  // Create a promise that will be stored and returned for parallel requests
  pendingRequests[cacheKey] = (async () => {
    try {
      // Guest mode endpoint - explicitly set requiresAuth to false
      const result = await apiRequest(endpoint, { method: 'GET' }, false);
      const duration = Date.now() - now;
      console.log(`City preview for ${city} (${tourType}): ${result.places?.length || 0} places in ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`fetchCityPreview failed after ${Date.now() - now}ms:`, error);
      
      // In case of failure, return a fallback empty result
      const fallback = {
        city: city,
        places: [],
        error: error.message
      };
      
      return fallback;
    } finally {
      // Remove the pending request reference after completion (success or error)
      delete pendingRequests[cacheKey];
    }
  })();
  
  return pendingRequests[cacheKey];
};

/**
 * Fetch audio tour for a place
 * @param {string} placeId - Google Place ID
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - Audio tour data
 */
export const fetchAudioTour = async (placeId, tourType) => {
  console.log(`fetchAudioTour called with: placeId=${placeId}, tourType=${tourType}`);
  const endpoint = `/audio/${placeId}?tourType=${tourType}`;
  const cacheKey = `audio-${placeId}-${tourType}`;
  const now = Date.now();
  
  // Check if there's already a pending request for this place/tour type
  if (pendingRequests[cacheKey]) {
    console.log(`Using in-flight audio request for ${placeId} (${tourType})`);
    return pendingRequests[cacheKey];
  }
  
  // Create a promise that will be stored and returned for parallel requests
  pendingRequests[cacheKey] = (async () => {
    try {
      const result = await apiRequest(endpoint, { method: 'GET' }, true);
      const duration = Date.now() - now;
      console.log(`fetchAudioTour completed in ${duration}ms, audio length: ${result.audio_url ? 'available' : 'unavailable'}`);
      return result;
    } catch (error) {
      console.error(`fetchAudioTour failed after ${Date.now() - now}ms:`, error);
      throw error;
    } finally {
      // Remove the pending request reference after completion
      delete pendingRequests[cacheKey];
    }
  })();
  
  return pendingRequests[cacheKey];
};

/**
 * Fetch preview audio tour for a place (no authentication required)
 * @param {string} placeId - Google Place ID
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - Audio tour preview data
 */
export const fetchPreviewAudioTour = async (placeId, tourType = 'history') => {
  console.log(`fetchPreviewAudioTour called with: placeId=${placeId}, tourType=${tourType}`);
  const endpoint = `/preview/audio/${placeId}?tour_type=${tourType}`;
  const cacheKey = `preview-audio-${placeId}-${tourType}`;
  const now = Date.now();
  
  // Check if there's already a pending request for this place/tour type
  if (pendingRequests[cacheKey]) {
    console.log(`Using in-flight preview audio request for ${placeId} (${tourType})`);
    return pendingRequests[cacheKey];
  }
  
  // Create a promise that will be stored and returned for parallel requests
  pendingRequests[cacheKey] = (async () => {
    try {
      const result = await apiRequest(endpoint, { method: 'GET' }, false);
      const duration = Date.now() - now;
      console.log(`fetchPreviewAudioTour completed in ${duration}ms, audio length: ${result.audio_url ? 'available' : 'unavailable'}`);
      return result;
    } catch (error) {
      console.error(`fetchPreviewAudioTour failed after ${Date.now() - now}ms:`, error);
      throw error;
    } finally {
      // Remove the pending request reference after completion
      delete pendingRequests[cacheKey];
    }
  })();
  
  return pendingRequests[cacheKey];
};