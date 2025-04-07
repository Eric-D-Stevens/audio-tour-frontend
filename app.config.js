import 'dotenv/config';

export default {
  expo: {
    name: "TensorTours",
    slug: "audio-tour-app", // Using original slug to match existing EAS project ID
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tensortours.app",
      buildNumber: "1",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FF5722"
      },
      package: "com.tensortours.app",
      versionCode: 1,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "b0e54264-5030-464c-8f06-5102817b2d44"
      }
    },
    owner: "vetqog-gampu0-xuvpav",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/b0e54264-5030-464c-8f06-5102817b2d44"
    }
  }
};
