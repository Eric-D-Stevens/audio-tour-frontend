/**
 * Import city images from assets
 */
const cityImages = {
  'san-francisco': require('../assets/cities/san-francisco.jpg'),
  'new-york': require('../assets/cities/new-york.jpg'),
  'london': require('../assets/cities/london.jpg'),
  'paris': require('../assets/cities/paris.jpg'),
  'tokyo': require('../assets/cities/tokyo.jpg'),
  'rome': require('../assets/cities/rome.jpg'),
  'giza': require('../assets/cities/giza.jpg'),
};

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
    image: cityImages['san-francisco']
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
    image: cityImages['new-york']
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
    image: cityImages['london']
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
    image: cityImages['paris']
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    coordinate: {
      latitude: 35.685998432864146,
      longitude: 139.75347686117274
    },
    description: 'Explore Shibuya Crossing, Tokyo Tower, and traditional temples',
    image: cityImages['tokyo']
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
    image: cityImages['rome']
  },
  {
    id: 'giza',
    name: 'Giza',
    country: 'Egypt',
    coordinate: {
      latitude: 29.9773,
      longitude: 31.1325
    },
    description: 'Marvel at the Great Pyramids, Sphinx, and ancient Egyptian wonders',
    image: cityImages['giza']
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
