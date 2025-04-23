import { API_BASE_URL } from '../constants/config';
import { getAuthToken } from './auth';
import { 
  GetPlacesRequest, 
  GetPlacesResponse, 
  GetPregeneratedTourRequest,
  GetPregeneratedTourResponse,
  GenerateTourRequest,
  GenerateTourResponse,
  TourType 
} from '../types/api-types';

// Track in-flight requests to prevent duplicates
const pendingRequests: Record<string, Promise<any>> = {};

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
        // First try to get token from our storage
        // The getAuthToken now returns an object with {token, error} structure
        const authResult = await getAuthToken();
        
        if (authResult && authResult.token) {
          // For API Gateway with Cognito User Pools Authorizer
          // Use indexer syntax with type assertion to avoid TypeScript errors
          (headers as Record<string, string>)['Authorization'] = authResult.token;
        } else {
          const errorMsg = authResult?.error || 'No authentication token available';
          throw new Error(errorMsg);
        }
      } catch (authError: any) {
        // For authenticated endpoints, propagate the error
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
      // For 401 errors, try to provide more helpful information
      if (response.status === 401) {
        // Only attempt to refresh the token on auth errors for endpoints that require auth
        // This avoids unnecessary sign-out operations in guest mode
        if (requiresAuth) {
          try {
            // Clear stored tokens to force a fresh login on next attempt
            const { signOut } = await import('./auth');
            await signOut();
            // Silent signout, no console logs
          } catch (authError) {
            // Silently catch auth cleanup errors to prevent app crashes
          }
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
      console.error(`API Error:`, error.message);
    }
    throw error;
  }
};

/**
 * Get places near a location
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radius - Search radius in meters
 * @param tourType - Type of tour
 * @param maxResults - Maximum number of results to return
 * @returns Places data with places array
 */
export const getPlaces = async (
  lat: number, 
  lng: number, 
  radius: number = 500, 
  tourType: TourType = 'history', 
  maxResults: number = 5
): Promise<GetPlacesResponse> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `places_${lat}_${lng}_${radius}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
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
 * Fetch city preview data
 * @param city - City name
 * @param tourType - Type of tour
 * @returns City preview data
 */
export const fetchCityPreview = async (
  city: string, 
  tourType: TourType = 'history'
): Promise<any> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `city_${city}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise(async (resolve, reject) => {
    try {
      const endpoint = `/getCityPreview`;
      
      const requestBody = {
        city: city,
        tour_type: tourType,
      };
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, false); // City previews don't require auth
      
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
      
      console.log(`Fetching preview places from: ${jsonUrl}`);
      
      try {
        // Fetch the JSON directly with more detailed logging
        console.log(`Attempting to fetch from exact URL: ${jsonUrl}`);
        
        const response = await fetch(jsonUrl);
        
        if (!response.ok) {
          // If we get a 403 or 404, log it with more details
          console.warn(`Preview data not accessible (${response.status} ${response.statusText})`);
          console.warn(`Full URL that failed: ${jsonUrl}`);
          
          // Try to get more error details if possible
          try {
            const errorText = await response.text();
            console.warn(`Error response body: ${errorText}`);
          } catch (textError) {
            console.warn('Could not read error response body');
          }
          
          // Continue to fallback below
          throw new Error(`Failed to fetch preview places: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Successfully loaded preview data for ${normalizedCity}/${normalizedTourType}`);
        // Result should follow the same format as GetPlacesResponse with places array
        resolve(result);
        return;
      } catch (fetchError: any) {
        // Log the error but continue to fallback
        console.warn(`Error fetching preview places: ${fetchError.message || 'Unknown error'}. Using fallback data.`);
        // Continue to fallback below
      }
      
      // Fallback: Return mock data with empty places array
      // This allows the app to continue working even when CloudFront/S3 has issues
      const fallbackResponse: GetPlacesResponse = {
        places: [],
        total_count: 0,
        is_authenticated: false
      };
      
      console.log(`Using fallback data for ${normalizedCity}/${normalizedTourType} (empty places array)`);
      resolve(fallbackResponse);
    } catch (error) {
      console.error('Error in getPreviewPlaces:', error);
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
 * Fetch preview audio tour for a place (no authentication required)
 * @param placeId - Google Place ID
 * @param tourType - Type of tour
 * @returns Audio tour preview data
 */
export const fetchPreviewAudioTour = async (
  placeId: string, 
  tourType: TourType = 'history'
): Promise<any> => {
  // Create a unique key for this request to prevent duplicates
  const requestKey = `preview_${placeId}_${tourType}`;
  
  // If this exact request is already in progress, return the existing promise
  const existingRequest = pendingRequests[requestKey];
  if (existingRequest) {
    return existingRequest;
  }
  
  // Create a new promise for this request
  const requestPromise = new Promise(async (resolve, reject) => {
    try {
      const endpoint = `/getPreviewTour`;
      
      const requestBody = {
        place_id: placeId,
        tour_type: tourType,
      };
      
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, false); // Preview tours don't require auth
      
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
