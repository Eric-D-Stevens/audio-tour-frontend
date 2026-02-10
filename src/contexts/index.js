import { createContext } from 'react';

// Create contexts for the app
export const AuthContext = createContext();
export const TourContext = createContext();
export { ThemeProvider, useTheme } from './ThemeContext';
export { AudioProvider, useAudio } from './AudioContext';
