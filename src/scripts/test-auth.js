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

// Function to prompt for credentials if not in .env
function promptForCredentials() {
  return new Promise((resolve) => {
    const credentials = {
      username: env.TEST_USERNAME,
      password: env.TEST_PASSWORD
    };

    if (credentials.username && credentials.password) {
      console.log('Using credentials from .env file');
      resolve(credentials);
    } else {
      rl.question('Username: ', (username) => {
        rl.question('Password: ', (password) => {
          resolve({ username, password });
        });
      });
    }
  });
}

// Sign in function
async function signIn(username, password) {
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
        console.log('\nAccess Token:', result.getAccessToken().getJwtToken());
        console.log('\nID Token:', result.getIdToken().getJwtToken());
        console.log('\nRefresh Token:', result.getRefreshToken().getToken());
        resolve(result);
      },
      onFailure: (err) => {
        console.error('\n❌ Authentication failed:', err.message || err);
        reject(err);
      }
    });
  });
}

// Sign up function
async function signUp(username, password, email) {
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, [
      { Name: 'email', Value: email }
    ], null, (err, result) => {
      if (err) {
        console.error('\n❌ Sign up failed:', err.message || err);
        reject(err);
        return;
      }
      console.log('\n✅ Sign up successful!');
      console.log('\nUser:', result.user);
      console.log('\nUserConfirmed:', result.userConfirmed);
      console.log('\nUserSub:', result.userSub);
      resolve(result);
    });
  });
}

// Check current authenticated user
function getCurrentUser() {
  const cognitoUser = userPool.getCurrentUser();
  
  if (cognitoUser) {
    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error('\n❌ Error getting session:', err.message || err);
        return;
      }
      
      if (session.isValid()) {
        console.log('\n✅ User is authenticated');
        console.log('\nSession validity:', session.isValid());
        
        // Get user attributes
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            console.error('\n❌ Error getting user attributes:', err.message || err);
            return;
          }
          
          console.log('\nUser attributes:');
          attributes.forEach(attr => {
            console.log(`${attr.getName()}: ${attr.getValue()}`);
          });
        });
      } else {
        console.log('\n❌ Session is not valid');
      }
    });
  } else {
    console.log('\n❌ No current user found');
  }
}

// Main function to run the test
async function runTest() {
  console.log('=== Cognito Authentication Test ===');
  console.log('Choose an option:');
  console.log('1. Sign In');
  console.log('2. Sign Up');
  console.log('3. Check Current User');
  console.log('4. Exit');
  
  rl.question('\nEnter option (1-4): ', async (option) => {
    try {
      switch (option) {
        case '1':
          const signInCreds = await promptForCredentials();
          await signIn(signInCreds.username, signInCreds.password);
          break;
          
        case '2':
          rl.question('Username: ', (username) => {
            rl.question('Password: ', (password) => {
              rl.question('Email: ', async (email) => {
                await signUp(username, password, email);
                rl.close();
              });
            });
          });
          return; // Don't close RL yet
          
        case '3':
          getCurrentUser();
          break;
          
        case '4':
          console.log('Exiting...');
          break;
          
        default:
          console.log('Invalid option');
      }
      
      rl.close();
    } catch (error) {
      console.error('Error:', error);
      rl.close();
    }
  });
}

// Run the test
runTest();
