import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts';

const SupportScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = {
    container: { flex: 1, backgroundColor: colors.background },
  };

  const dynamicMarkdownStyles = {
    heading1: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: 16, marginTop: 24 },
    heading2: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12, marginTop: 20 },
    heading3: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 10, marginTop: 16 },
    heading4: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, marginTop: 12 },
    paragraph: { fontSize: 16, lineHeight: 24, color: colors.text, marginBottom: 16 },
    list_item: { marginBottom: 8 },
    strong: { fontWeight: 'bold' },
    link: { color: colors.primary, textDecorationLine: 'underline' },
    body: { color: colors.text },
  };
  // Embed the support content directly in the component
  const supportContent = `# TensorTours Support Guide

_Last Updated: April 26, 2025_

## Welcome to TensorTours Support

Thank you for choosing TensorTours, your AI-powered audio tour companion. This document provides information on how to use our application and how to get support when you need it.

## How TensorTours Works

TensorTours is an innovative audio tour application that uses artificial intelligence to create personalized, location-based audio guides.

### Key Features

- **AI-Generated Audio Tours**: Our application uses advanced AI to generate informative and engaging audio content about points of interest around you.
- **Location-Based Content**: The app uses your location to identify nearby points of interest and provide relevant audio content.
- **Photo Galleries**: View high-quality images of points of interest alongside your audio content.

### Getting Started

#### Guest Mode

TensorTours offers a guest mode that allows you to explore the app without creating an account or sharing your location:

1. **Access Guest Mode**: When you first open the app, select "Continue as Guest" on the welcome screen.
2. **Browse Preset Cities**: View a curated selection of popular cities with pre-generated audio tours.
3. **Explore City Tours**: Select any city to view available points of interest and their audio content.
4. **Listen to Audio Tours**: Tap on any point of interest to access its audio tour and photo gallery.

Guest mode is perfect for trying out TensorTours or accessing content for pre-planned trips without using your current location.

#### Full Experience (Logged-in Mode)

For a personalized experience with access to all features:

1. **Create an Account**: Sign up with your email address to unlock all features and save your preferences.
2. **Allow Location Access**: Grant location permissions to discover points of interest near your current location.
3. **Start Exploring**: Follow the map to discover points of interest with personalized audio content tailored to your surroundings.

## Customer Support

Our support team is here to help you with any questions or issues you may encounter while using TensorTours.

### Contact Information

- **Email**: e.stevens@tensorworks.co
- **Response Time**: We aim to respond to all inquiries within 24-48 hours during business days.

### Reporting Issues

When reporting an issue, please include:
- Your device model and operating system version
- App version number
- A detailed description of the issue
- Screenshots if applicable

## Managing Your Data

### Deleting Your Account

Deleting your account is a simple process:

1. Open the app and log in to your account
2. Tap the hamburger menu (≡) in the top corner of the screen
3. Select "Delete Account"
4. Confirm your choice when prompted

Account deletion will permanently remove your account and immediately revoke your access to the app's services. Please note that some residual data may be maintained in our backup systems for up to 30 days after deletion.

### Accessing or Deleting Your User Data

To request access to your personal data or to request deletion of specific personal data while maintaining your account:

1. Send an email to e.stevens@tensorworks.co
2. Include "Data Access Request" or "Data Deletion Request" in the subject line
3. Provide your registered email address and a description of the data you'd like to access or delete

Our support team will process your request and respond within 30 days in accordance with applicable data protection regulations.

## Troubleshooting Common Issues

### Location Services

**Issue**: App cannot access your location
**Solution**: 
- Ensure location services are enabled on your device
- Verify that TensorTours has permission to access your location
- Restart the app after granting permissions

### Audio Playback

**Issue**: Audio tours not playing
**Solution**:
- Check your device volume and ensure it's not muted
- Verify internet connection if downloading new content
- Close and reopen the application

### Login Problems

**Issue**: Cannot log in to your account
**Solution**:
- Verify your email address and password
- Use the "Forgot Password" feature to reset your password
- Ensure you have an active internet connection

### Network Connectivity

**Issue**: App shows offline screen
**Solution**:
- Check your internet connection
- Toggle airplane mode off and on
- Use the "Reconnect" button to attempt to reestablish connection

## Frequently Asked Questions

### General Questions

**Q: Is TensorTours available worldwide?**
A: TensorTours is available in most countries, but content quality may vary by location depending on available data.

**Q: Do I need an internet connection to use TensorTours?**
A: Yes, TensorTours requires an internet connection to function properly. The app needs connectivity to identify points of interest and generate audio content.

**Q: How accurate is the location-based content?**
A: TensorTours uses GPS and Google Places API to provide accurate location-based content. The accuracy depends on your device's GPS signal strength and the availability of information about points of interest in your area.

### Account Management

**Q: Can I use TensorTours on multiple devices?**
A: Yes, you can sign in to your TensorTours account on multiple devices.

**Q: How do I cancel my subscription?**
A: There is no subscription - TensorTours is completely free! If you'd like to stop using the app, you can delete your account by tapping the hamburger menu (≡), selecting "Delete Account", and confirming your choice.

### Content & Features

**Q: How is the audio content created?**
A: TensorTours uses advanced AI technology to generate informative and engaging audio content based on publicly available information about points of interest.

**Q: Can I save tours for later?**
A: This feature is not currently available, but we're actively considering adding it in a future update. We're always working to improve TensorTours based on user feedback.

**Q: How often is the content updated?**
A: We continuously improve our AI systems to enhance content quality. Information about points of interest is updated regularly through our API integrations.

## Contact Us

If you have any questions, concerns, or feedback that isn't addressed in this support guide, please contact us at:

Email: e.stevens@tensorworks.co

TensorWorks`;

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <AppHeader navigation={navigation} title="Support" />
      <ScrollView style={styles.contentContainer}>
        <View style={styles.markdownContainer}>
          <Markdown style={dynamicMarkdownStyles}>
            {supportContent}
          </Markdown>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  markdownContainer: {
    padding: 8,
  },
});

const markdownStyles = {
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 16,
    marginTop: 24,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  heading3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
    marginTop: 16,
  },
  heading4: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  list_item: {
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold',
  },
  link: {
    color: '#FF5722',
    textDecorationLine: 'underline',
  },
};

export default SupportScreen;
