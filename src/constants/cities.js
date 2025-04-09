/**
 * Preset cities for guest mode
 * Each city includes name, coordinates, and a brief description
 */
export const PRESET_CITIES = [
  {
    id: 'san-francisco',
    name: 'San Francisco',
    country: 'USA',
    coordinate: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    description: 'Explore the Golden Gate Bridge, Alcatraz, and vibrant neighborhoods',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29'
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'USA',
    coordinate: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    description: 'Discover Times Square, Central Park, and the Statue of Liberty',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'
  },
  {
    id: 'london',
    name: 'London',
    country: 'UK',
    coordinate: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    description: 'Visit Big Ben, Buckingham Palace, and the Tower of London',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    coordinate: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    description: 'Experience the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    coordinate: {
      latitude: 35.6762,
      longitude: 139.6503
    },
    description: 'Explore Shibuya Crossing, Tokyo Tower, and traditional temples',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    coordinate: {
      latitude: 41.9028,
      longitude: 12.4964
    },
    description: 'Discover the Colosseum, Vatican City, and Roman Forum',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5'
  }
];

/**
 * Get a city by its ID
 * @param {string} cityId - ID of the city to retrieve
 * @returns {Object|null} - City object or null if not found
 */
export const getCityById = (cityId) => {
  return PRESET_CITIES.find(city => city.id === cityId) || null;
};

/**
 * Get the default city (first in the list)
 * @returns {Object} - Default city object
 */
export const getDefaultCity = () => {
  return PRESET_CITIES[0];
};
