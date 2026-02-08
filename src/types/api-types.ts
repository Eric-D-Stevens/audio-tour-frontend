/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

/**
 * Type of tour to generate
 */
export type TourType = "history" | "cultural" | "architecture" | "art" | "nature";
/**
 * Types of tours available
 */
export type TourType1 = "history" | "cultural" | "architecture" | "art" | "nature";
/**
 * Types of tours available
 */
export type TourType2 = "history" | "cultural" | "architecture" | "art" | "nature";
/**
 * Types of tours available
 */
export type TourType3 = "history" | "cultural" | "architecture" | "art" | "nature";
/**
 * Types of tours available
 */
export type TourType4 = "history" | "cultural" | "architecture" | "art" | "nature";
/**
 * Types of tours available
 */
export type TourType5 = "history" | "cultural" | "architecture" | "art" | "nature";

/**
 * Base request model with user information
 */
export interface BaseRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
}
/**
 * Model for Cognito user information extracted from the request context
 */
export interface CognitoUser {
  /**
   * Cognito user ID (sub)
   */
  user_id: string;
  /**
   * Cognito username
   */
  username?: string | null;
  /**
   * User email address
   */
  email?: string | null;
  /**
   * Cognito user groups
   */
  groups?: string[];
}
/**
 * Request model for generating a new tour
 */
export interface GenerateTourRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
  /**
   * ID of the place to generate a tour for
   */
  place_id: string;
  tour_type: TourType;
  /**
   * Language code for the tour
   */
  language_code?: string;
}
/**
 * Response model for generating a new tour
 */
export interface GenerateTourResponse {
  tour: TTour;
  /**
   * Whether the request was authenticated
   */
  is_authenticated?: boolean;
}
export interface TTour {
  place_id: string;
  tour_type: TourType1;
  place_info: TTPlaceInfo;
  photos: TTPlacePhotos[];
  script: TTScript;
  audio: TTAudio;
  metadata?: string;  // JSON-encoded string with original scraped data (Winter Lights)
}
/**
 * Place information model
 */
export interface TTPlaceInfo {
  place_id: string;
  place_name: string;
  place_editorial_summary: string;
  place_address: string;
  place_primary_type: string;
  place_types: string[];
  place_location: {
    [k: string]: number;
  };
  retrieved_at?: string;
}
/**
 * Place photos model
 */
export interface TTPlacePhotos {
  photo_id: string;
  place_id: string;
  cloudfront_url: string;
  s3_url: string;
  attribution: {
    [k: string]: string;
  };
  size_width: number;
  size_height: number;
  retrieved_at?: string;
  [k: string]: unknown;
}
/**
 * Tour script model
 */
export interface TTScript {
  script_id: string;
  place_id: string;
  place_name: string;
  tour_type: TourType1;
  model_info: {
    [k: string]: unknown;
  };
  s3_url: string;
  cloudfront_url: string;
  generated_at?: string;
  [k: string]: unknown;
}
/**
 * Tour audio model
 */
export interface TTAudio {
  place_id: string;
  script_id: string;
  cloudfront_url: string;
  s3_url: string;
  model_info: {
    [k: string]: unknown;
  };
  generated_at?: string;
  [k: string]: unknown;
}
/**
 * Request model for getting an on-demand tour
 *
 * This model is similar to GetPregeneratedTourRequest but can also include place_info
 * for places that don't have existing data in the database.
 */
export interface GetOnDemandTourRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
  /**
   * ID of the place to get a tour for
   */
  place_id: string;
  tour_type: TourType2;
  /**
   * JSON string with place information if not already in database
   */
  place_info_json?: string | null;
}
/**
 * Response model for getting an on-demand tour
 *
 * This model is used for returning tours that are generated on-demand
 * without using the tour table or generation queue.
 */
export interface GetOnDemandTourResponse {
  tour: TTour;
  /**
   * Whether the request was authenticated
   */
  is_authenticated?: boolean;
  /**
   * Whether the tour was generated on-demand
   */
  generated_on_demand?: boolean;
}
/**
 * Request model for getting places near a location
 */
export interface GetPlacesRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
  tour_type: TourType3;
  /**
   * Latitude of the search location
   */
  latitude: number;
  /**
   * Longitude of the search location
   */
  longitude: number;
  /**
   * Search radius in meters
   */
  radius?: number;
  /**
   * Maximum number of results to return
   */
  max_results?: number;
}
/**
 * Response model for getting places near a location
 */
export interface GetPlacesResponse {
  places: TTPlaceInfo[];
  total_count: number;
  /**
   * Whether the request was authenticated
   */
  is_authenticated?: boolean;
}
/**
 * Request model for getting a pregenerated tour
 */
export interface GetPregeneratedTourRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
  /**
   * ID of the place to get a tour for
   */
  place_id: string;
  tour_type: TourType4;
}
/**
 * Response model for getting a pregenerated tour
 */
export interface GetPregeneratedTourResponse {
  tour: TTour;
  /**
   * Whether the request was authenticated
   */
  is_authenticated?: boolean;
}
/**
 * Request model for getting a preview tour
 *
 * This model is used specifically for requesting preview tours that are
 * pre-generated and available in the preview dataset.
 */
export interface GetPreviewRequest {
  /**
   * User information from Cognito
   */
  user?: CognitoUser | null;
  /**
   * Unique request identifier
   */
  request_id?: string | null;
  /**
   * Request timestamp
   */
  timestamp?: string | null;
  /**
   * ID of the place to get a preview tour for
   */
  place_id: string;
  tour_type: TourType5;
}
/**
 * Response model for getting a preview tour
 *
 * This model is used for returning preview tours that are pre-generated
 * and available in the preview dataset.
 */
export interface GetPreviewResponse {
  tour: TTour;
  /**
   * Whether the request was authenticated
   */
  is_authenticated?: boolean;
}
