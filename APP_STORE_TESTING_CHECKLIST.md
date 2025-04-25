# TensorTours App Store Testing Checklist

*Created: April 24, 2025*

This checklist provides a comprehensive guide for testing the TensorTours app before App Store submission to maximize the chances of approval on the first review.

## Functionality Testing

### Core Features
- [ ] **Authentication**
  - [ ] User registration works correctly
  - [ ] Login/logout functions properly
  - [ ] Password reset flow is functional
  - [ ] Session persists appropriately across app restarts

- [ ] **Tour Creation**
  - [ ] Tour duration slider works correctly (30-180 minutes)
  - [ ] Category selection (History, Art, Culture, etc.) is functional
  - [ ] Location detection works accurately
  - [ ] Tour generation completes successfully

- [ ] **Google Places Integration**
  - [ ] Place photos load correctly with proper attribution
  - [ ] Place details display accurately
  - [ ] Photo galleries function in both horizontal and vertical layouts

- [ ] **Audio Playback**
  - [ ] Audio tours play correctly
  - [ ] Audio controls (play, pause, skip) work as expected
  - [ ] Background audio playback functions properly

- [ ] **Maps**
  - [ ] Maps load correctly with proper location permissions
  - [ ] Tour routes display accurately
  - [ ] Location tracking works during tours
  - [ ] Points of interest appear at correct locations

### Error Handling
- [ ] **No Connection Scenarios**
  - [ ] App provides appropriate feedback when network is unavailable
  - [ ] Previously loaded content remains accessible offline
  - [ ] App gracefully recovers when connection is restored

- [ ] **API Error Handling**
  - [ ] Google Places API errors are handled gracefully
  - [ ] Authentication errors show appropriate messages
  - [ ] Tour generation failures provide clear user feedback

- [ ] **User Input Validation**
  - [ ] Forms validate input correctly
  - [ ] Error messages are clear and helpful
  - [ ] App prevents submission of invalid data

## UI/UX Testing

### Visual Design
- [ ] **Brand Consistency**
  - [ ] Orange primary color (#FF5722) is used consistently
  - [ ] Logo and icons display correctly
  - [ ] Typography is consistent throughout the app

- [ ] **Layout Testing**
  - [ ] UI elements are properly aligned
  - [ ] Spacing is consistent throughout the app
  - [ ] No cut-off text or images
  - [ ] No overlapping UI elements

- [ ] **Animation & Transitions**
  - [ ] Screen transitions are smooth
  - [ ] Loading indicators display appropriately
  - [ ] Animations don't cause performance issues

### Usability
- [ ] **Navigation**
  - [ ] Tab bar navigation works correctly
  - [ ] Stack navigation (back button) functions properly
  - [ ] Navigation titles are clear and descriptive

- [ ] **Accessibility**
  - [ ] Text is readable at different font sizes
  - [ ] Color contrast meets accessibility standards
  - [ ] Interactive elements have adequate touch targets (minimum 44×44 points)
  - [ ] VoiceOver support works correctly for main features

- [ ] **Keyboard Handling**
  - [ ] Keyboard appears/disappears appropriately
  - [ ] Forms scroll properly when keyboard is shown
  - [ ] Return key behavior is appropriate for each field
  - [ ] Tab order is logical in multi-field forms

## Cross-Device Testing

### iPhone Testing
Test on at least one device from each size category:
- [ ] **Small (4.7")**
  - [ ] iPhone SE (2nd generation or newer)
  - [ ] All UI elements visible and properly sized
  - [ ] No performance issues

- [ ] **Medium (5.8-6.1")**
  - [ ] iPhone X, XS, 11 Pro, 12, 13, or 14
  - [ ] All UI elements visible and properly sized
  - [ ] No performance issues

- [ ] **Large (6.5-6.7")**
  - [ ] iPhone XS Max, 11 Pro Max, 12 Pro Max, 13 Pro Max, or 14 Pro Max
  - [ ] All UI elements visible and properly sized
  - [ ] No performance issues

### iPad Testing (if supporting iPad)
- [ ] **iPad (10.2")**
  - [ ] Layout adapts correctly to larger screen
  - [ ] Split-view mode functions correctly

- [ ] **iPad Pro (11" or 12.9")**
  - [ ] Layout adapts correctly to larger screen
  - [ ] UI elements scale appropriately

### Orientation Testing
- [ ] **Portrait Mode**
  - [ ] All screens display correctly in portrait mode
  - [ ] Navigation works correctly

- [ ] **Landscape Mode (if supported)**
  - [ ] All screens display correctly in landscape mode
  - [ ] UI elements reflow appropriately
  - [ ] Navigation works correctly

## Performance Testing

### Resource Usage
- [ ] **Memory Usage**
  - [ ] App doesn't exceed reasonable memory limits during extended use
  - [ ] No memory leaks during navigation between screens

- [ ] **Battery Consumption**
  - [ ] App doesn't cause excessive battery drain
  - [ ] Background processes are optimized

- [ ] **Network Efficiency**
  - [ ] App uses caching appropriately
  - [ ] Images and media are optimized for mobile
  - [ ] API calls are batched where appropriate

### Responsiveness
- [ ] **Startup Time**
  - [ ] App launches in a reasonable time (<5 seconds)
  - [ ] Splash screen displays correctly during loading

- [ ] **Interaction Responsiveness**
  - [ ] UI responds quickly to user input
  - [ ] Animations run at 60fps
  - [ ] No jank or stuttering during scrolling

## Pre-Submission Final Checks

### Debug Removal
- [ ] **Debug Code**
  - [ ] All console.log statements removed or disabled
  - [ ] Debug flags set to false or removed
  - [ ] No developer comments in user-facing text

- [ ] **Test Data**
  - [ ] All test accounts removed
  - [ ] No placeholder content in production build
  - [ ] All sample data replaced with real content

### Legal Compliance
- [ ] **Terms & Privacy**
  - [ ] Privacy policy URL is valid and loads correctly
  - [ ] Terms of service accessible from the app
  - [ ] All third-party service usage disclosed

- [ ] **Attribution**
  - [ ] Google Places attribution displayed properly
  - [ ] All open source libraries properly attributed

### Production Build Testing
- [ ] **Final EAS Build**
  - [ ] Create production build using EAS: `eas build --platform ios --profile production`
  - [ ] Install and test production build on physical device
  - [ ] Verify all features work in production build
  - [ ] Test offline functionality in production build

## App Store Specific Checks

### App Store Assets
- [ ] **Screenshots**
  - [ ] Prepare screenshots for all required iPhone sizes
  - [ ] Screenshots show key features of the app
  - [ ] No placeholder content visible in screenshots

- [ ] **App Icon**
  - [ ] App Store icon (1024×1024) prepared
  - [ ] No alpha channel in App Store icon
  - [ ] Icon meets Apple's design guidelines

- [ ] **App Description**
  - [ ] Clear, concise description of app purpose
  - [ ] Key features highlighted
  - [ ] No typos or grammatical errors

- [ ] **Keywords**
  - [ ] Relevant keywords selected
  - [ ] Keywords match app functionality

### App Store Connect Configuration
- [ ] **App Privacy**
  - [ ] Data collection practices accurately disclosed
  - [ ] Tracking permissions properly configured

- [ ] **Age Rating**
  - [ ] Appropriate age rating selected
  - [ ] Content warnings correctly specified

---

*This checklist is specifically tailored for the TensorTours app based on the features detected in the codebase. Use it to systematically test your app before submitting to the App Store for review.*
