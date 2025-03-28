const fetch = require('node-fetch');
const { CognitoUserPool, CognitoUser, AuthenticationDetails } = require('amazon-cognito-identity-js');
const env = require('./env');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize Cognito User Pool with credentials from .env
const userPool = new CognitoUserPool({
  UserPoolId: env.COGNITO_USER_POOL_ID,
  ClientId: env.COGNITO_CLIENT_ID
});

// Cache for storing tokens and session data
const sessionCache = {
  idToken: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null
};

// Function to prompt for input
function promptInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to authenticate user
async function authenticate() {
  console.log('\n=== Authentication ===');
  const username = env.TEST_USERNAME || await promptInput('Username: ');
  const password = env.TEST_PASSWORD || await promptInput('Password: ');
  
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });
    
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });
    
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log('\n✅ Authentication successful!');
        
        // Store tokens in cache
        sessionCache.idToken = result.getIdToken().getJwtToken();
        sessionCache.accessToken = result.getAccessToken().getJwtToken();
        sessionCache.refreshToken = result.getRefreshToken().getToken();
        
        // Set expiration time (1 hour from now)
        const expiresIn = result.getIdToken().getExpiration() - result.getIdToken().getIssuedAt();
        sessionCache.expiresAt = Date.now() + expiresIn * 1000;
        
        // Save session to file for reuse
        saveSessionToFile();
        
        resolve({
          idToken: sessionCache.idToken,
          accessToken: sessionCache.accessToken
        });
      },
      onFailure: (err) => {
        console.error('\n❌ Authentication failed:', err.message || err);
        resolve(null);
      }
    });
  });
}

// Function to save session to file
function saveSessionToFile() {
  const sessionFile = path.resolve(__dirname, '../../.session.json');
  fs.writeFileSync(sessionFile, JSON.stringify(sessionCache, null, 2));
  console.log('\nSession saved to .session.json');
}

// Function to load session from file
function loadSessionFromFile() {
  try {
    const sessionFile = path.resolve(__dirname, '../../.session.json');
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      
      // Check if session is still valid
      if (data.expiresAt && data.expiresAt > Date.now()) {
        Object.assign(sessionCache, data);
        console.log('\nLoaded valid session from .session.json');
        return true;
      } else {
        console.log('\nSession expired, need to authenticate again');
        return false;
      }
    }
  } catch (error) {
    console.error('\nError loading session:', error.message);
  }
  return false;
}

// Function to get authentication token
async function getAuthToken() {
  // Try to load from file first
  if (loadSessionFromFile() && sessionCache.idToken) {
    return {
      idToken: sessionCache.idToken,
      accessToken: sessionCache.accessToken
    };
  }
  
  // If no valid session, authenticate
  return authenticate();
}

// Function to make API call
async function callApi(endpoint, tokens, method = 'GET', body = null, useMock = false) {
  console.log(`\nCalling API: ${endpoint} (${method})`);
  
  // Mock data for testing
  const mockData = {
    'tours': [
      { id: '1', title: 'San Francisco Highlights', description: 'Explore the iconic landmarks of SF' },
      { id: '2', title: 'New York City Walk', description: 'Experience the Big Apple' }
    ],
    'tours/1': {
      id: '1',
      title: 'San Francisco Highlights',
      description: 'Explore the iconic landmarks of SF',
      city: 'San Francisco',
      duration: '2 hours',
      distance: '3.5 miles',
      audioFiles: [
        { id: '101', title: 'Golden Gate Bridge', duration: '5:30' },
        { id: '102', title: 'Fisherman\'s Wharf', duration: '4:45' }
      ]
    },
    'cities': [
      { id: '1', name: 'San Francisco', tourCount: 3 },
      { id: '2', name: 'New York', tourCount: 2 }
    ],
    'user/profile': {
      username: 'testuser',
      email: 'test@example.com',
      preferences: {
        favoriteCity: 'San Francisco',
        language: 'English'
      }
    }
  };
  
  // Use mock data if requested or if API_BASE_URL not set
  if (useMock || !env.API_BASE_URL) {
    console.log('\n⚠️ Using mock data');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the right mock data
    let mockResponse = mockData[endpoint];
    if (!mockResponse && endpoint.startsWith('tours/')) {
      const tourId = endpoint.split('/')[1];
      mockResponse = mockData['tours/1']; // Just return the first tour for any ID
      mockResponse.id = tourId;
    }
    
    return mockResponse || { message: 'No mock data available for this endpoint' };
  }
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (tokens && tokens.idToken) {
      headers['Authorization'] = `Bearer ${tokens.idToken}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const url = `${env.API_BASE_URL}${endpoint}`;
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, options);
    
    // Log response status
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Parse response body
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { 
        rawText: await response.text(),
        status: response.status
      };
    }
    
    return data;
  } catch (error) {
    console.error('\n❌ API call failed:', error.message || error);
    return { error: error.message || 'API call failed' };
  }
}

// Function to display API response
function displayResponse(data) {
  console.log('\nAPI Response:');
  console.log(JSON.stringify(data, null, 2));
}

// Function to test tour listing
async function testTourListing(tokens) {
  console.log('\n=== Testing Tour Listing ===');
  const useMock = await promptInput('Use mock data? (y/n) [default: n]: ') === 'y';
  
  const toursData = await callApi('tours', tokens, 'GET', null, useMock);
  displayResponse(toursData);
  
  return toursData;
}

// Function to test tour details
async function testTourDetails(tokens, tours) {
  console.log('\n=== Testing Tour Details ===');
  
  let tourId;
  if (tours && tours.length > 0) {
    console.log('\nAvailable tours:');
    tours.forEach((tour, index) => {
      console.log(`${index + 1}. ${tour.title} (ID: ${tour.id})`);
    });
    
    const selection = await promptInput('\nSelect a tour (number) or enter a custom ID: ');
    const index = parseInt(selection) - 1;
    
    if (!isNaN(index) && index >= 0 && index < tours.length) {
      tourId = tours[index].id;
    } else {
      tourId = selection;
    }
  } else {
    tourId = await promptInput('Enter Tour ID: ');
  }
  
  const useMock = await promptInput('Use mock data? (y/n) [default: n]: ') === 'y';
  const tourData = await callApi(`tours/${tourId}`, tokens, 'GET', null, useMock);
  displayResponse(tourData);
}

// Function to test user profile
async function testUserProfile(tokens) {
  console.log('\n=== Testing User Profile ===');
  
  if (!tokens) {
    console.log('\n⚠️ Authentication required for this endpoint');
    tokens = await authenticate();
    if (!tokens) return;
  }
  
  const useMock = await promptInput('Use mock data? (y/n) [default: n]: ') === 'y';
  const profileData = await callApi('user/profile', tokens, 'GET', null, useMock);
  displayResponse(profileData);
}

// Function to test custom API call
async function testCustomApiCall(tokens) {
  console.log('\n=== Custom API Call ===');
  
  const endpoint = await promptInput('Enter API endpoint (e.g., tours/featured): ');
  const method = await promptInput('Enter HTTP method (GET, POST, PUT, DELETE) [default: GET]: ') || 'GET';
  
  let body = null;
  if (method === 'POST' || method === 'PUT') {
    const bodyStr = await promptInput('Enter request body as JSON (or leave empty): ');
    if (bodyStr) {
      try {
        body = JSON.parse(bodyStr);
      } catch (e) {
        console.error('\n❌ Invalid JSON. Using empty body.');
      }
    }
  }
  
  const useMock = await promptInput('Use mock data? (y/n) [default: n]: ') === 'y';
  const customData = await callApi(endpoint, tokens, method, body, useMock);
  displayResponse(customData);
}

// Main function to run the test
async function runTest() {
  console.log('=== Audio Tour API Test Suite ===');
  console.log('This script will help you test the Audio Tour API endpoints');
  console.log('You can use real API calls or mock data for testing');
  
  // Get authentication token
  let tokens = await getAuthToken();
  if (!tokens) {
    console.log('\n⚠️ Proceeding without authentication. Some endpoints may not be accessible.');
  } else {
    console.log('\n✅ Using authentication tokens');
  }
  
  let tours = null;
  
  while (true) {
    console.log('\nChoose a test to run:');
    console.log('1. Test Authentication');
    console.log('2. Test Tour Listing');
    console.log('3. Test Tour Details');
    console.log('4. Test User Profile');
    console.log('5. Custom API Call');
    console.log('6. Exit');
    
    const option = await promptInput('\nEnter option (1-6): ');
    
    switch (option) {
      case '1':
        tokens = await authenticate();
        break;
        
      case '2':
        tours = await testTourListing(tokens);
        break;
        
      case '3':
        await testTourDetails(tokens, tours);
        break;
        
      case '4':
        await testUserProfile(tokens);
        break;
        
      case '5':
        await testCustomApiCall(tokens);
        break;
        
      case '6':
        console.log('\nExiting...');
        rl.close();
        return;
        
      default:
        console.log('Invalid option');
    }
  }
}

// Run the test
runTest();
