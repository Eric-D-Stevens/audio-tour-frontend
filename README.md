# TensorTours Mobile App

## What is TensorTours?

TensorTours is an AI-powered audio tour application that transforms how travelers explore new places. The app uses advanced AI to generate personalized audio guides based on the user's location, preferences, and available time. TensorTours delivers rich, contextual information about points of interest, historical sites, and cultural landmarks in real-time as users explore.

Key features:
- Customizable tour durations (30-180 minutes)
- Multiple tour categories (History, Art, Culture, Food & Drink, Architecture, Nature)
- Location-aware content that adapts to where you are
- Beautiful interface with the TensorTours orange (#FF5722) branding
- High-quality images from Google Places with proper attribution
- Seamless authentication and account management

## Frontend Repository Role

This repository contains the mobile application for TensorTours, built with React Native and Expo. The frontend is responsible for:

1. **User Interface**: All screens, components, and visual elements of the application
2. **Location Services**: Tracking user location and integrating with maps
3. **Audio Playback**: Playing generated tour audio content
4. **Authentication Flow**: User registration, login, and session management
5. **API Integration**: Communicating with the backend services

### Key Components

- React Native + Expo framework
- React Navigation for screen transitions and navigation
- Direct Amazon Cognito Identity JS integration for authentication
- AsyncStorage for session persistence
- Integration with device location services
- Google Places API for place photos and information

### Screens

- **TourBuilderScreen**: Main screen for logged-in users to create new tours
- **HomeScreen**: Landing page showcasing featured tours
- **MapScreen**: Interactive map showing tour locations and points of interest
- **AudioScreen**: Audio player interface for tour content
- **AuthScreen**: User authentication interface
- **CityPreviewScreen**: Browse available cities for tours

### Custom Components

- **PlacePhoto**: Display place photos with proper attribution
- **PlacePhotoGallery**: Gallery component showing multiple photos for a location

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (copy .env.example to .env and fill in required values)

3. Start the development server:
   ```
   npx expo start
   ```

4. Use the Expo Go app on your mobile device or an emulator to test the application

### Development Notes

- The app uses a combination of Stack Navigator and Bottom Tab Navigator for navigation
- Authentication is handled through direct integration with Amazon Cognito Identity JS
- Session persistence is implemented using AsyncStorage
- Location permissions are properly configured in app.config.js
