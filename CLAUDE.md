# TensorTours — Frontend

React Native / Expo mobile app for the TensorTours audio tour experience.

## Tech Stack

- **React Native** 0.81.5
- **Expo** 54
- **React** 19
- **TypeScript** (services layer; JSX files are `.js`)
- **App name/slug:** TensorTours / `audio-tour-app`
- **Bundle ID:** `com.tensortours.app`

## Key Directories

```
audio-tour-frontend/
├── App.js                  # Root: defines 4 of the 5 Contexts, navigation tree
├── screens/                # Top-level screen components
├── components/             # Shared UI components
├── services/               # API calls, storage helpers (TypeScript)
├── contexts/               # React Context definitions
│   └── AudioContext.js     # The one context NOT in App.js
├── constants/              # Colors, config values, API endpoints
└── assets/                 # Images, fonts
```

## State Management

Five React Contexts manage global state:

| Context | Defined in |
|---------|-----------|
| AuthContext | App.js |
| TourContext | App.js |
| ThemeContext | App.js |
| NetworkContext | App.js |
| AudioContext | `contexts/AudioContext.js` |

## Authentication

- Provider: **AWS Cognito** via `amazon-cognito-identity-js`
- Tokens stored in **`expo-secure-store`**

## Key AsyncStorage Keys

- `tensortours_tour_params` — saved tour parameters (logged-in users)
- `tensortours_guest_tour_params` — saved tour parameters (guest users)

## Dev Commands

```bash
npm start                    # Expo dev server
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm run web                  # Web browser
./start-android-emulator.sh  # Launch Android emulator (run from workspace root)
```

## Platform-Specific Patterns

- Map marker components have `.android.js` variants alongside the default `.js` file.
  React Native's platform resolution picks these up automatically.

## Known Issues

- `tsconfig.json` has a `customConditions` error due to `moduleResolution` mismatch.
  This is a lint/IDE noise issue and does not affect the runtime build.
