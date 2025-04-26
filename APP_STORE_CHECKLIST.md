# App Store Publication Checklist for TensorTours

This checklist is designed to help ensure the TensorTours app meets Apple's requirements for App Store submission.

## 1. App Metadata and Configuration
- ✅ App has a unique name ("TensorTours")
- ✅ App has proper iOS bundle identifier (com.tensortours.app)
- ✅ Location permissions are properly configured
- ✅ App icon files are complete for all required sizes
  - ✅ Updated app.config.js with iOS-specific icon configuration
  - ✅ Using existing 1024x1024 adaptive-icon.png for App Store submission
- ⚠️ Need to verify splash screen assets are properly configured
- ⚠️ Need privacy policy URL (required for all apps)

## 2. Technical Requirements
- ✅ Using compatible Expo SDK version (48.0.0)
- ✅ Required native modules are installed (gesture-handler, reanimated, masked-view)
- ⚠️ Need to remove any debug code before submission
- ⚠️ Need to ensure app works in airplane mode or with poor connectivity
- ⚠️ Need to verify app doesn't crash on launch or during normal usage

## 3. User Interface
- ⚠️ Need to ensure UI follows Human Interface Guidelines
- ⚠️ Need to verify app looks good on all supported iOS devices
- ⚠️ Need to check dark mode compatibility
- ⚠️ Need to ensure proper keyboard handling

## 4. Content and Functionality
- ⚠️ Need to verify all app features are functional
- ⚠️ Need to ensure no placeholder or test content in production build
- ⚠️ Need to create compelling screenshots for App Store listing
- ⚠️ Need to write clear app description highlighting value proposition

## 5. Privacy and Legal
- ✅ Location usage descriptions are configured
- ⚠️ Need App Tracking Transparency permission if tracking users
- ⚠️ Need accurate App Privacy labels in App Store Connect
- ⚠️ Need terms of service documentation
- ⚠️ Need to disclose third-party services (Google Places API) usage

## 6. Build and Submission
- ⚠️ Need to test production build extensively before submission
- ⚠️ Need to create Apple Developer account if not done already
- ⚠️ Need to create app record in App Store Connect
- ⚠️ Need to configure app pricing and availability

## Next Steps

1. **Complete app.config.js**:
   - Add privacy policy URL
   - ✅ Updated iOS icon configuration in app.config.js
   - ✅ Using existing adaptive-icon.png (1024x1024) for the App Store

2. **App Store Assets**:
   - Create high-quality screenshots
   - Write compelling app description
   - Prepare promotional text

3. **Testing**:
   - Test on multiple iOS devices
   - Conduct thorough testing in production mode
   - Verify offline functionality

4. **Documentation**:
   - Create privacy policy document
   - Prepare terms of service
   - Document all data usage for App Privacy declarations

Created: April 24, 2025
