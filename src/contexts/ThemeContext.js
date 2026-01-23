import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

const lightColors = {
  primary: '#FF5722',
  primaryLight: '#FF8a65',
  primaryFaded: 'rgba(255, 87, 34, 0.08)',
  primaryFadedMore: 'rgba(255, 87, 34, 0.05)',
  background: '#FFFFFF',
  surface: '#f5f5f5',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  textPlaceholder: '#AAAAAA',
  border: '#e0e0e0',
  divider: '#e0e0e0',
  error: '#F44336',
  success: '#4CAF50',
  mapOverlay: 'rgba(255, 255, 255, 0.95)',
  modalBackground: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#f5f5f5',
  buttonText: '#FFFFFF',
  guestButtonBackground: '#FFF3E0',
  shadowColor: '#000000',
  statusBar: 'dark',
};

const darkColors = {
  primary: '#FF7043',
  primaryLight: '#FFAB91',
  primaryFaded: 'rgba(255, 112, 67, 0.15)',
  primaryFadedMore: 'rgba(50, 50, 50, 0.5)',
  background: '#121212',
  surface: '#1E1E1E',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#808080',
  textPlaceholder: '#999999',
  border: '#333333',
  divider: '#333333',
  error: '#EF5350',
  success: '#66BB6A',
  mapOverlay: 'rgba(18, 18, 18, 0.95)',
  modalBackground: 'rgba(0, 0, 0, 0.7)',
  inputBackground: '#2C2C2C',
  buttonText: '#FFFFFF',
  guestButtonBackground: '#2A1A10',
  shadowColor: '#000000',
  statusBar: 'light',
};

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
