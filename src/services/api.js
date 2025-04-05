import { API_BASE_URL } from '../constants/config';
import { getAuthToken } from './auth';

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
      // First try to get token from our storage
      const token = await getAuthToken();
      
      if (token) {
        // For API Gateway with Cognito User Pools Authorizer
        headers['Authorization'] = token;
        console.log(`Using stored auth token, length: ${token.length}`);
      } else {
        console.log('No authentication token available');
        throw new Error('Authentication required');
      }
    }

    console.log(`Sending request to: ${API_BASE_URL}${endpoint}`);
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
        // Attempt to refresh the token on auth errors
        if (requiresAuth) {
          // Clear stored tokens to force a fresh login on next attempt
          const { signOut } = await import('./auth');
          await signOut();
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
    
    // Log successful API response
    console.log(`API call to ${endpoint} completed successfully:`, {
      status: response.status,
      dataSize: JSON.stringify(data).length,
      timestamp: new Date().toISOString(),
      endpoint: `${API_BASE_URL}${endpoint}`
    });
    
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
 * Fetch city preview data
 * @param {string} city - City name
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - City preview data
 */
export const fetchCityPreview = async (city, tourType = 'history') => {
  console.log(`fetchCityPreview called with: city=${city}, tourType=${tourType}`);
  const endpoint = `/preview/${encodeURIComponent(city)}?tour_type=${tourType}`;
  const startTime = Date.now();
  
  try {
    const result = await apiRequest(endpoint, { method: 'GET' }, false);
    const duration = Date.now() - startTime;
    console.log(`fetchCityPreview completed in ${duration}ms with ${result.places?.length || 0} places`);
    return result;
  } catch (error) {
    console.error(`fetchCityPreview failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
};

/**
 * Fetch audio tour for a place
 * @param {string} placeId - Google Place ID
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - Audio tour data
 */
export const fetchAudioTour = async (placeId, tourType = 'history') => {
  console.log(`fetchAudioTour called with: placeId=${placeId}, tourType=${tourType}`);
  const endpoint = `/audio/${placeId}?tourType=${tourType}`;
  const startTime = Date.now();
  
  try {
    const result = await apiRequest(endpoint, { method: 'GET' }, true);
    const duration = Date.now() - startTime;
    console.log(`fetchAudioTour completed in ${duration}ms, audio length: ${result.audio_url ? 'available' : 'unavailable'}`);
    return result;
  } catch (error) {
    console.error(`fetchAudioTour failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
};

/**
 * Fetch preview audio tour for a place (no authentication required)
 * @param {string} placeId - Google Place ID
 * @param {string} tourType - Type of tour (history, cultural, etc.)
 * @returns {Promise<Object>} - Audio tour preview data
 */
export const fetchPreviewAudioTour = async (placeId, tourType = 'history') => {
  console.log(`fetchPreviewAudioTour called with: placeId=${placeId}, tourType=${tourType}`);
  const endpoint = `/preview/audio/${placeId}?tourType=${tourType}`;
  const startTime = Date.now();
  
  try {
    const result = await apiRequest(endpoint, { method: 'GET' }, false);
    const duration = Date.now() - startTime;
    console.log(`fetchPreviewAudioTour completed in ${duration}ms, audio length: ${result.audio_url ? 'available' : 'unavailable'}`);
    return result;
  } catch (error) {
    console.error(`fetchPreviewAudioTour failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  }
};