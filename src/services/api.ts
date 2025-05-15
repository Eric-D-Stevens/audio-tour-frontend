import { API_BASE_URL } from '../constants/config';
import { getAuthToken, refreshTokenIfNeeded, cleanupInvalidAuth } from './auth';
import { 
  GetPlacesRequest, 
  GetPlacesResponse, 
  GetPregeneratedTourRequest,
  GetPregeneratedTourResponse,
  GenerateTourRequest,
  GenerateTourResponse,
  GetPreviewRequest,
  TourType 
} from '../types/api-types';
import logger from '../utils/logger';

// Track in-flight requests to prevent duplicates
const pendingRequests: Record<string, Promise<any>> = {};

// Cache for getPlaces API responses
interface CacheEntry {
  timestamp: number;
  response: GetPlacesResponse;
  lat: number;
  lng: number;
}

// Cache structure: { tourType_radius: { cacheKey: CacheEntry } }
const placesCache: Record<string, Record<string, CacheEntry>> = {};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Maximum distance to consider for using cached results (in meters)
const MAX_CACHE_DISTANCE = 300;

/**
 * Clear the places cache for all or specific tour types
 * @param tourType - Optional tour type to clear cache for, or undefined to clear all
 * @param radius - Optional radius to clear cache for, or undefined to clear for all radii
 */
export const clearPlacesCache = (tourType?: TourType, radius?: number): void => {
  if (!tourType) {
    // Clear entire cache
    Object.keys(placesCache).forEach(key => {
      delete placesCache[key];
    });
    logger.debug('Cleared entire places cache');
    return;
  }
  
  if (radius) {
    // Clear specific tour type and radius
    const cacheCategory = `${tourType}_${radius}`;
    delete placesCache[cacheCategory];
    logger.debug(`Cleared places cache for ${tourType} tours with ${radius}m radius`);
  } else {
    // Clear all radii for specific tour type
    Object.keys(placesCache).forEach(key => {
      if (key.startsWith(`${tourType}_`)) {
        delete placesCache[key];
      }
    });
    logger.debug(`Cleared places cache for all ${tourType} tours`);
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in meters
 */
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * 
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Base API request function with authentication
 * @param endpoint - API endpoint
 * @param options - Request options
 * @param requiresAuth - Whether the request requires authentication
 * @returns Response data
 */
const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}, 
  requiresAuth: boolean = true
): Promise<any> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add authentication token if required
    if (requiresAuth) {
      try {
        // Try to get a valid token, with automatic refresh if needed
        const authResult = await getAuthToken();
        
        if (authResult && authResult.token) {
          // For API Gateway with Cognito User Pools Authorizer
          (headers as Record<string, string>)['Authorization'] = authResult.token;
        } else {
          // If refresh failed but we have a specific error, provide it
          const errorMsg = authResult?.error || 'No authentication token available';
          
          // Only log token issues if they're unexpected
          if (!errorMsg.includes('No refresh token') && !errorMsg.includes('Token expired')) {
            logger.warn('Auth token issue:', errorMsg);
          }
          
          throw new Error(errorMsg);
        }
      } catch (authError: any) {
        // For authenticated endpoints, propagate the error but don't retry here
        // We'll let the calling code decide if it should retry or redirect to login
        throw new Error(`Authentication required: ${authError.message}`);
      }
    }

    // Simplified request logging
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle response errors
    if (!response.ok) {
      const errorText = await response.text();
      
      // For 401/403 errors, try to refresh the token once and retry
      if ((response.status === 401 || response.status === 403) && requiresAuth) {
        try {
          // Try a token refresh
          logger.debug('Received auth error, attempting token refresh and retry');
          const refreshResult = await refreshTokenIfNeeded(true); // Force refresh
          
          if (refreshResult.token) {
            // Retry the request with the new token
            logger.debug('Token refreshed, retrying request');
            
            // Update the Authorization header with the new token
            (headers as Record<string, string>)['Authorization'] = refreshResult.token;
            
            // Retry the request
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
            
            // If retry succeeded, process the response
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
            
            // If retry failed, continue with normal error handling
            const retryErrorText = await retryResponse.text();
            try {
              const errorJson = JSON.parse(retryErrorText);
              throw new Error(errorJson.message || errorJson.error || `Request failed after token refresh: ${retryResponse.status}`);
            } catch (e) {
              throw new Error(`Request failed after token refresh: ${retryResponse.status}: ${retryErrorText}`);
            }
          }
        } catch (refreshError: any) {
          // If refresh failed, clean up invalid tokens and continue with original error
          logger.debug('Token refresh failed:', refreshError.message || 'Unknown refresh error');
          await cleanupInvalidAuth(); // Clean up invalid auth data to prevent repeated failures
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
    
    // Return data without logging
    return data;
  } catch (error: any) {
    // Only log errors that aren't authentication errors and aren't 404s from getTour
    // This helps suppress expected 404s when a tour doesn't exist yet
    if (!error.message.includes('Authentication') && 
        !(error.message.includes('Tour not found') || error.message.includes('status 404'))) {
      logger.error(`API Error:`, error.message);
    }
    throw error;
  }
};

/**
 * Get places near a location with caching
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radius - Search radius in meters
 * @param tourType - Type of tour
 * @param maxResults - Maximum number of results to return
 * @param skipCache - Whether to skip cache and force a new request
 * @returns Places data with places array
 */
export const getPlaces = async (
  lat: number, 
  lng: number, 
  radius: number = 500, 
  tourType: TourType = 'history', 
  maxResults: number = 5,
  skipCache: boolean = false
): Promise<GetPlacesResponse> => {
  // Format latitude and longitude to 5 decimal places for cache key
  // This gives ~1.1m precision at the equator which is sufficient for our caching needs
  const formattedLat = parseFloat(lat.toFixed(5));
  const formattedLng = parseFloat(lng.toFixed(5));
  
  // Create unique keys for the request and cache category
  const requestKey = `places_${formattedLat}_${formattedLng}_${radius}_${tourType}_${maxResults}`;
  const cacheCategory = `${tourType}_${radius}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    logger.debug('Using in-flight request for getPlaces');
    return existingRequest;
  }
  
  // Check cache if not explicitly skipped
  if (!skipCache) {
    const categoryCache = placesCache[cacheCategory];
    
    // If we have cached entries for this tour type and radius
    if (categoryCache) {
      // Find any cache entry that's close enough to our current location
      for (const key in categoryCache) {
        const entry = categoryCache[key];
        
        // Check if cache is still fresh
        const now = Date.now();
        if (now - entry.timestamp < CACHE_TTL) {
          // Calculate distance between current location and cached location
          const distance = calculateDistance(lat, lng, entry.lat, entry.lng);
          
          // If within acceptable distance, return cached response
          if (distance <= MAX_CACHE_DISTANCE) {
            logger.debug(`Using cached getPlaces response (${distance.toFixed(0)}m away, ${((now - entry.timestamp)/1000).toFixed(0)}s old)`);
            return entry.response;
          }
        } else {
          // Clean up expired cache entry
          delete categoryCache[key];
        }
      }
    } else {
      // Initialize cache category
      placesCache[cacheCategory] = {};
    }
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise<GetPlacesResponse>(async (resolve, reject) => {
    try {
      const endpoint = `/getPlaces`;
      
      // Structure follows GetPlacesRequest from generated types
      const requestBody: GetPlacesRequest = {
        latitude: lat,
        longitude: lng,
        radius: radius,
        tour_type: tourType,
        max_results: maxResults
      };
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, true);
      
      // Cache the successful response
      placesCache[cacheCategory][requestKey] = {
        timestamp: Date.now(),
        response: result,
        lat: lat,
        lng: lng
      };
      
      // Result should follow GetPlacesResponse with places array
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      // Clean up the pending request
      delete pendingRequests[requestKey];
    }
  });
  
  // Store the promise so we can return it for duplicate requests
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};

/**
 * Fetch complete tour data for a place
 * @param placeId - Google Place ID
 * @param tourType - Type of tour
 * @returns Complete tour data including place info, photos, script and audio
 */
export const getTour = async (
  placeId: string, 
  tourType: TourType = 'history'
): Promise<GetPregeneratedTourResponse> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `tour_${placeId}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise<GetPregeneratedTourResponse>(async (resolve, reject) => {
    try {
      // Use the dedicated getTour endpoint
      const endpoint = `/getTour`;
      
      // Structure follows GetPregeneratedTourRequest from generated types
      const requestBody: GetPregeneratedTourRequest = {
        place_id: placeId,
        tour_type: tourType,
      };
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, true);
      
      // Result should follow GetPregeneratedTourResponse with a tour property
      resolve(result);
    } catch (error: any) {
      // Handle specific error cases such as "tour not found"
      if (error.message && error.message.includes('not found')) {
        // Help guide the user with a more specific error:
        error.message = `Tour not found for ${placeId}. You may need to generate this tour first.`;
      }
      reject(error);
    } finally {
      // Clean up the pending request
      delete pendingRequests[requestKey];
    }
  });
  
  // Store the promise so we can return it for duplicate requests
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};

// fetchAudioTour function has been removed - use getTour instead

/**
 * Get preview places from pre-generated JSON files
 * @param city - City name (lowercase)
 * @param tourType - Type of tour
 * @returns Places data with places array (same format as getPlaces)
 * Note: This endpoint does not require authentication
 */
export const getPreviewPlaces = async (
  city: string,
  tourType: TourType = 'history'
): Promise<GetPlacesResponse> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `preview_places_${city}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise<GetPlacesResponse>(async (resolve, reject) => {
    try {
      // Normalize city name to lowercase for the URL
      let normalizedCity = city.toLowerCase().trim();
      
      // Handle common city name variations
      if (normalizedCity === 'sf' || normalizedCity === 'san-francisco') {
        normalizedCity = 'san-francisco';
      } else if (normalizedCity === 'ny' || normalizedCity === 'new-york') {
        normalizedCity = 'new-york';
      } else if (normalizedCity === 'tokyo') {
        normalizedCity = 'tokyo';
      } else if (normalizedCity === 'london') {
        normalizedCity = 'london';
      }
      
      // Normalize tour type to lowercase
      const normalizedTourType = tourType.toLowerCase();
      
      // Construct the URL to the JSON file
      // This is a public endpoint that doesn't require authentication
      const jsonUrl = `https://d2g5o5njd6p5e.cloudfront.net/preview/${normalizedCity}/${normalizedTourType}/places.json`;
      
      logger.info(`Fetching preview places from: ${jsonUrl}`);
      
      try {
        // Fetch the JSON directly with more detailed logging
        logger.debug(`Attempting to fetch from exact URL: ${jsonUrl}`);
        
        const response = await fetch(jsonUrl);
        
        if (!response.ok) {
          // If we get a 403 or 404, log it with more details
          logger.warn(`Preview data not accessible (${response.status} ${response.statusText})`);
          logger.warn(`Full URL that failed: ${jsonUrl}`);
          
          // Try to get more error details if possible
          try {
            const errorText = await response.text();
            logger.warn(`Error response body: ${errorText}`);
          } catch (textError) {
            logger.warn('Could not read error response body');
          }
          
          // Continue to fallback below
          throw new Error(`Failed to fetch preview places: ${response.status}`);
        }
        
        const result = await response.json();
        logger.info(`Successfully loaded preview data for ${normalizedCity}/${normalizedTourType}`);
        // Result should follow the same format as GetPlacesResponse with places array
        resolve(result);
        return;
      } catch (fetchError: any) {
        // Log the error but continue to fallback
        logger.warn(`Error fetching preview places: ${fetchError.message || 'Unknown error'}. Using fallback data.`);
        // Continue to fallback below
      }
      
      // Fallback: Return mock data with empty places array
      // This allows the app to continue working even when CloudFront/S3 has issues
      const fallbackResponse: GetPlacesResponse = {
        places: [],
        total_count: 0,
        is_authenticated: false
      };
      
      logger.info(`Using fallback data for ${normalizedCity}/${normalizedTourType} (empty places array)`);
      resolve(fallbackResponse);
    } catch (error) {
      logger.error('Error in getPreviewPlaces:', error);
      // Instead of rejecting with an error, return an empty response
      // This prevents the app from crashing when preview data isn't available
      resolve({
        places: [],
        total_count: 0,
        is_authenticated: false
      });
    } finally {
      // Clean up the pending request
      delete pendingRequests[requestKey];
    }
  });
  
  // Store the promise so we can return it for duplicate requests
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};


/**
 * Generate a tour on-demand for a specific place
 * @param placeId - Google Place ID
 * @param tourType - Type of tour
 * @param languageCode - Language code for the tour
 * @returns Generated tour data
 */
export const getOnDemandTour = async (
  placeId: string,
  tourType: TourType = 'history',
  languageCode: string = 'en'
): Promise<GenerateTourResponse> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `ondemand_${placeId}_${tourType}_${languageCode}_${Date.now()}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise<GenerateTourResponse>(async (resolve, reject) => {
    try {
      const endpoint = `/getOnDemandTour`;
      
      const requestBody: GenerateTourRequest = {
        place_id: placeId,
        tour_type: tourType,
        language_code: languageCode,
        request_id: requestKey,
        timestamp: new Date().toISOString()
      };
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, true); // Explicitly require authentication
      
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      // Clean up the pending request
      delete pendingRequests[requestKey];
    }
  });
  
  // Store the promise so we can return it for duplicate requests
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};

/**
 * Fetch preview tour for a place (no authentication required)
 * @param placeId - Google Place ID
 * @param tourType - Type of tour
 * @returns Audio tour preview data
 */
export const fetchPreviewTour = async (
  placeId: string, 
  tourType: TourType = 'history'
): Promise<any> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `preview_tour_${placeId}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise(async (resolve, reject) => {
    try {
      const endpoint = `/getPreviewTour`;
      
      const requestBody: GetPreviewRequest = {
        place_id: placeId,
        tour_type: tourType,
        request_id: requestKey,
        timestamp: new Date().toISOString()
      };
      
      logger.info(`Fetching preview tour for place: ${placeId}, type: ${tourType}`);
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, false); // Preview tours don't require auth
      
      logger.info(`Successfully fetched preview tour for place: ${placeId}`);
      resolve(result);
    } catch (error) {
      logger.error(`Error fetching preview tour for place: ${placeId}:`, error);
      reject(error);
    } finally {
      // Clean up the pending request
      delete pendingRequests[requestKey];
    }
  });
  
  // Store the promise so we can return it for duplicate requests
  pendingRequests[requestKey] = requestPromise;
  
  return requestPromise;
};
