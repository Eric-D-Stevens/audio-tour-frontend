# TensorTours Human Interface Guidelines Compliance Checklist

*Created: April 24, 2025*

This checklist is specifically designed to help ensure your TensorTours app complies with Apple's Human Interface Guidelines (HIG), minimizing the risk of rejection during App Store review.

## 1. General Interface Principles

### Layout & Structure
- [ ] **Respect Safe Areas**
  - [ ] Content doesn't extend into notch, Dynamic Island, or home indicator areas
  - [ ] Proper insets applied to all screen edges
  - [ ] No content clipped by device corners

- [ ] **Information Architecture**
  - [ ] Content organized in a clear, logical hierarchy
  - [ ] Most important content visible without scrolling
  - [ ] Tour information presented in scanning-friendly format

- [ ] **Visual Hierarchy**
  - [ ] Primary actions (e.g., "Start Tour") are most prominent
  - [ ] Secondary actions visually subordinate to primary actions
  - [ ] Related items visually grouped together

### Visual Design
- [ ] **Typography**
  - [ ] Text is legible at default size (minimum 17pt for body text)
  - [ ] Proper font weight hierarchy (headings vs. body text)
  - [ ] Text has sufficient contrast against backgrounds
  - [ ] Line length comfortable for reading (30-40 characters per line ideal)

- [ ] **Color Usage**
  - [ ] TensorTours orange (#FF5722) used appropriately for highlights, not overwhelming
  - [ ] Sufficient contrast between text and backgrounds (minimum 4.5:1)
  - [ ] Color not used as the only means to convey information
  - [ ] Interactive elements visually distinct from non-interactive elements

- [ ] **Branding Integration**
  - [ ] TensorTours branding tastefully incorporated
  - [ ] Branding doesn't interfere with usability
  - [ ] Orange brand color used consistently

## 2. UI Components & Patterns

### Navigation
- [ ] **Tab Bar**
  - [ ] Limited to 5 or fewer tabs
  - [ ] Each tab represents a distinct mode or category
  - [ ] Icons are distinct and communicate tab purpose
  - [ ] Selected tab clearly indicated

- [ ] **Navigation Bar**
  - [ ] Title clearly indicates current location
  - [ ] Back button present and functional when appropriate
  - [ ] Navigation titles concise yet descriptive
  - [ ] Actions in navigation bar are relevant to current context

- [ ] **Modal Presentations**
  - [ ] Used sparingly for focused tasks (e.g., login, settings)
  - [ ] Include clear way to dismiss (e.g., Done button, swipe down)
  - [ ] Modal purpose immediately clear to users

### Controls
- [ ] **Buttons**
  - [ ] Primary action buttons use filled style with TensorTours orange
  - [ ] Secondary actions use appropriate visual weight
  - [ ] Touch targets minimum 44×44 points
  - [ ] Button text is clear and action-oriented

- [ ] **Form Controls**
  - [ ] Text fields have clear labels
  - [ ] Error states provide clear feedback
  - [ ] Keyboard type appropriate for each input (e.g., email, number)
  - [ ] Form submission button clearly indicates action

- [ ] **Interactive Elements**
  - [ ] Sliders (for tour duration) have appropriate track and thumb size
  - [ ] Selection controls (for tour categories) clearly indicate selected state
  - [ ] Consistency in interaction behavior across similar elements

## 3. Platform Integration

### iOS Patterns
- [ ] **System Features**
  - [ ] Respects system appearance (light/dark mode)
  - [ ] Adapts to system text size changes (Dynamic Type)
  - [ ] Proper keyboard handling (scrolls when keyboard appears)
  - [ ] App responds appropriately to interruptions (calls, notifications)

- [ ] **Gestures**
  - [ ] Standard gestures used consistently (swipe to go back, etc.)
  - [ ] Custom gestures (if any) are discoverable and explained
  - [ ] No conflicts with system gestures

- [ ] **Authentication**
  - [ ] Sign In with Apple offered if other social logins are present
  - [ ] Biometric authentication implemented according to guidelines (if used)

## 4. Specific App Features

### Maps & Location
- [ ] **Maps Integration**
  - [ ] Map controls are easily accessible
  - [ ] Location pins use standard or clearly understandable design
  - [ ] Tour routes visibly distinct from other map elements
  - [ ] Map zoom level appropriate for viewing tour routes

- [ ] **Location Functionality**
  - [ ] Clear permission requests with good explanations
  - [ ] Location accuracy appropriate for tour guidance
  - [ ] User location clearly indicated on maps
  - [ ] Proximity alerts for POIs are not excessive

### Audio Tours
- [ ] **Playback Controls**
  - [ ] Audio controls follow iOS conventions
  - [ ] Play/pause button has minimum 44×44pt touch target
  - [ ] Progress indication clear and interactive
  - [ ] Volume control accessible

- [ ] **Audio Experience**
  - [ ] Background audio behavior appropriate
  - [ ] Respects system audio interruptions
  - [ ] Clear indication when audio is playing
  - [ ] Audio quality consistent across tours

### Photo Galleries
- [ ] **Google Places Photos**
  - [ ] Photos display with proper attribution as required
  - [ ] Gallery navigation intuitive (swipe, etc.)
  - [ ] Loading states properly indicated
  - [ ] Placeholders shown during photo loading

## 5. Special Considerations

### Accessibility
- [ ] **VoiceOver Support**
  - [ ] All UI elements have appropriate accessibility labels
  - [ ] Custom controls have proper accessibility traits
  - [ ] Focus order logical for screen readers
  - [ ] No critical information conveyed solely through visual means

- [ ] **Text Size Adaptation**
  - [ ] Supports Dynamic Type for all text elements
  - [ ] Layout adapts to larger text sizes without breaking
  - [ ] Critical information visible at larger text sizes

- [ ] **Contrast & Color**
  - [ ] Sufficient contrast for all text and essential UI elements
  - [ ] Information not conveyed by color alone
  - [ ] Works well with Increase Contrast accessibility setting

### Responsive Design
- [ ] **Device Adaptation**
  - [ ] UI scales appropriately across iPhone models
  - [ ] No content clipped on smaller devices
  - [ ] No excessive empty space on larger devices
  - [ ] Layout adjusts for orientation changes (if supported)

## 6. Common App Store Rejection Issues

- [ ] **User Experience**
  - [ ] No unexpected behavior or confusing navigation
  - [ ] Error messages are clear and helpful
  - [ ] Loading times reasonable with proper indicators
  - [ ] App doesn't claim features it doesn't have

- [ ] **Content Issues**
  - [ ] No placeholder content in final build
  - [ ] All third-party content properly attributed
  - [ ] Tour content accurate and high-quality
  - [ ] No inappropriate content in tours or photos

- [ ] **Performance**
  - [ ] App launches within reasonable time
  - [ ] No excessive battery or data usage
  - [ ] Smooth scrolling and transitions
  - [ ] No memory leaks or crashes

## How to Use This Checklist

1. Conduct a visual review of your app against each item
2. Test on multiple iPhone models when possible
3. Pay special attention to areas marked as concerns in previous reviews
4. Document any issues found and prioritize fixes before submission
5. Consider involving someone unfamiliar with the app for unbiased feedback

---

*This checklist is tailored specifically for the TensorTours app based on Apple's Human Interface Guidelines. While comprehensive, always refer to Apple's latest documentation for the most current recommendations.*
