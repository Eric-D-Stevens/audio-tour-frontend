import 'dotenv/config';

export default {
  expo: {
    name: "TensorTours",
    slug: "audio-tour-app", // Using original slug to match existing EAS project ID
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png", // Default icon for all platforms
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "cover",
      backgroundColor: "#FF5722"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tensortours.app",
      buildNumber: "1",
      icon: "./assets/adaptive-icon.png", // Using existing adaptive icon for iOS
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "TensorTours needs access to your location to find nearby points of interest for audio tours.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "TensorTours uses your location to find nearby points of interest and provide location-based audio tours.",
        NSLocationAlwaysUsageDescription: "TensorTours uses your location in the background to notify you of nearby points of interest.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["audio"],
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
      },
      statusBar: {
        backgroundColor: "#FFFFFF",
        style: "dark"
      },
      backgroundColor: "#FFFFFF"
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
      },
      permissions: ["android.permission.FOREGROUND_SERVICE"],
      softwareKeyboardLayoutMode: "pan"
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
