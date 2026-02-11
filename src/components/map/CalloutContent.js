import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Shared Callout Components
 * 
 * Common UI building blocks used by Callout.ios.js and Callout.android.js.
 * Platform files import from './CalloutContent' to compose their layouts.
 */

export const CalloutTitle = ({ title, colors }) => (
  <Text style={[styles.title, { color: colors.text || '#333' }]}>
    {title}
  </Text>
);

export const CalloutDescription = ({ description, colors }) => (
  <Text 
    style={[styles.description, { color: colors.textSecondary || '#666' }]} 
    numberOfLines={2}
  >
    {description}
  </Text>
);

export const CalloutButton = ({ 
  onPress, 
  text, 
  iconName = "play",
  primary = true,
  colors 
}) => (
  <TouchableOpacity
    style={[
      styles.button,
      primary ? styles.buttonPrimary : [styles.buttonSecondary, { borderColor: colors.border || '#ccc' }],
    ]}
    onPress={onPress}
  >
    <Text style={primary ? styles.buttonTextPrimary : [styles.buttonTextSecondary, { color: colors.textSecondary || '#666' }]}>
      {text}
    </Text>
    {primary && iconName && (
      <Ionicons name={iconName} size={16} color="white" style={{ marginLeft: 6 }} />
    )}
  </TouchableOpacity>
);

export const CalloutButtonRow = ({ children }) => (
  <View style={styles.buttonRow}>
    {children}
  </View>
);

export const CalloutContentWrapper = ({ children, colors }) => (
  <View style={[styles.content, { backgroundColor: colors.card || 'white' }]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  content: {
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: '#FF5722',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
  },
});
