const fetch = require('node-fetch');
const { CognitoUserPool, CognitoUser, AuthenticationDetails } = require('amazon-cognito-identity-js');
const env = require('./env');
const readline = require('readline');

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

// Mock data for testing when API is unavailable
const mockData = {
  tours: [
    {
      id: '1',
      title: 'San Francisco Highlights',
      description: 'Explore the iconic landmarks of SF',
      city: 'San Francisco',
      duration: '2 hours',
      distance: '3.5 miles',
      audioFiles: [
        { id: '101', title: 'Golden Gate Bridge', duration: '5:30' },
        { id: '102', title: 'Fisherman\'s Wharf', duration: '4:45' },
        { id: '103', title: 'Alcatraz Island', duration: '6:15' }
      ]
    },
    {
      id: '2',
      title: 'New York City Walk',
      description: 'Experience the Big Apple',
      city: 'New York',
      duration: '3 hours',
      distance: '4 miles',
      audioFiles: [
        { id: '201', title: 'Times Square', duration: '6:00' },
        { id: '202', title: 'Central Park', duration: '7:30' },
        { id: '203', title: 'Empire State Building', duration: '5:15' }
      ]
    }
  ],
  cities: [
    { id: '1', name: 'San Francisco', tourCount: 3 },
    { id: '2', name: 'New York', tourCount: 2 },
    { id: '3', name: 'Chicago', tourCount: 1 }
  ]
};

// Function to get authentication token
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      console.log('No authenticated user found. Please authenticate first.');
      resolve(null);
      return;
    }
    
    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error('Error getting session:', err);
        resolve(null);
        return;
      }
      
      if (session.isValid()) {
        resolve(session.getIdToken().getJwtToken());
      } else {
        console.log('Session is not valid. Please authenticate again.');
        resolve(null);
      }
    });
  });
}

// Function to authenticate user
async function authenticate() {
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
        resolve(result.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        console.error('\n❌ Authentication failed:', err.message || err);
        resolve(null);
      }
    });
  });
}

// Helper function to prompt for input
function promptInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to make API call
async function callApi(endpoint, token, method = 'GET', body = null) {
  console.log(`\nCalling API: ${endpoint}`);
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = token;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    // Check if we should use mock data (if API_BASE_URL is not set or if it's a test endpoint)
    if (!env.API_BASE_URL || endpoint.includes('mock')) {
      console.log('\n⚠️ Using mock data (API_BASE_URL not set or mock endpoint requested)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (endpoint.includes('tours')) {
        if (endpoint.includes('/tours/') && endpoint.split('/').length > 2) {
          const tourId = endpoint.split('/').pop();
          const tour = mockData.tours.find(t => t.id === tourId);
          return tour || { error: 'Tour not found' };
        }
        return mockData.tours;
      } else if (endpoint.includes('cities')) {
        return mockData.cities;
      } else {
        return { message: 'Unknown mock endpoint' };
      }
    }
    
    // Make the actual API call
    const url = `${env.API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();
    
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

// Main function to run the test
async function runTest() {
  console.log('=== Audio Tour API Test ===');
  
  let token = await getAuthToken();
  if (!token) {
    console.log('\nNo valid token found. Attempting to authenticate...');
    token = await authenticate();
  }
  
  if (!token) {
    console.log('\n⚠️ Proceeding without authentication. Some endpoints may not be accessible.');
  } else {
    console.log('\n✅ Using authentication token:', token.substring(0, 20) + '...');
  }
  
  while (true) {
    console.log('\nChoose an API to test:');
    console.log('1. Get All Tours');
    console.log('2. Get Tour by ID');
    console.log('3. Get All Cities');
    console.log('4. Get User Profile');
    console.log('5. Custom API Call');
    console.log('6. Exit');
    
    const option = await promptInput('\nEnter option (1-6): ');
    
    switch (option) {
      case '1':
        const toursData = await callApi('tours', token);
        displayResponse(toursData);
        break;
        
      case '2':
        const tourId = await promptInput('Enter Tour ID: ');
        const tourData = await callApi(`tours/${tourId}`, token);
        displayResponse(tourData);
        break;
        
      case '3':
        const citiesData = await callApi('cities', token);
        displayResponse(citiesData);
        break;
        
      case '4':
        if (!token) {
          console.log('\n⚠️ Authentication required for this endpoint');
          token = await authenticate();
          if (!token) continue;
        }
        const profileData = await callApi('user/profile', token);
        displayResponse(profileData);
        break;
        
      case '5':
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
        
        const customData = await callApi(endpoint, token, method, body);
        displayResponse(customData);
        break;
        
      case '6':
        console.log('Exiting...');
        rl.close();
        return;
        
      default:
        console.log('Invalid option');
    }
  }
}

// Run the test
runTest();
