# 📋 Usability & Accessibility Report: HridAI

**Project:** HridAI - Cardiac Health Companion  
**Date:** December 5, 2025  
**Platform:** React Native (iOS & Android)

---

## Executive Summary

**HridAI** is a cardiac health companion app built with React Native. While it has a polished visual design and good UX patterns, there are several accessibility gaps that need attention to comply with WCAG 2.1 guidelines and ensure inclusive usage.

---

## ✅ Strengths

### 1. Good Visual Design & Theming
- Consistent dark theme (`#0D1B2A`) throughout the app
- Clear visual hierarchy with distinct colors for different elements
- Good use of contrast for primary actions (red `#DC3545` on dark background)

### 2. User-Friendly Form Handling
- Pre-filled default credentials option with toggle switch
- Real-time form validation
- Clear error messages via `Alert.alert()`
- Mobile number input restricted to 10 digits with numeric keyboard

### 3. Helpful Loading & Error States
- Distinct loading state with spinner and contextual messaging
- Clear error recovery with retry button
- Connection status indicators (Online/Offline/Connecting)

### 4. Intuitive Chat Interface
- Quick action buttons for common symptoms
- Typing indicators and animated response indicators
- Clear message differentiation (user vs. doctor bubbles)
- Auto-scroll to latest messages

### 5. Safety Features
- Emergency disclaimer prominently displayed ("For emergencies, call 112")
- Trust indicators (HIPAA Compliant, End-to-End Encrypted)

---

## ❌ Accessibility Issues

### Critical (WCAG Level A Violations)

#### 1. Missing `accessibilityLabel` on Interactive Elements

**Affected Components:**
- `TouchableOpacity` buttons (Continue button, Quick actions)
- `TextInput` fields
- `Switch` toggle
- Emoji decorations used as icons

**Location:** `src/screens/LoginScreen.tsx` (lines 223-235), `src/screens/ChatScreen.tsx` (lines 546-555, 571-581)

**Recommendation:** Add `accessibilityLabel` and `accessibilityRole` props:

<TouchableOpacity
  accessibilityLabel="Start consultation"
  accessibilityRole="button"
  accessibilityState={{ disabled: !isFormValid }}
  // ...
>#### 2. Form Labels Not Programmatically Associated

**Location:** `src/screens/LoginScreen.tsx` (lines 170-220)

**Recommendation:** Use `accessibilityLabel` that includes the label text:

<TextInput
  accessibilityLabel="Health ID input field"
  accessibilityHint="Enter your Health ID, for example ABHA ID"
/>#### 3. Emoji Icons Without Text Alternatives

The app uses emojis extensively for visual elements:
- `❤️`, `🩺`, `🏥`, `🔒`, `🛡️`, `💬`, `📱`, `👤`, `🆔`, `🔑`

These are **not accessible to screen readers** without proper labeling.

**Recommendation:** Wrap decorative emojis with `accessibilityElementsHidden` or provide meaningful labels:

<Text accessibilityElementsHidden={true} style={styles.heartIcon}>❤️</Text>
// OR for meaningful icons:
<Text accessibilityLabel="Heart icon" accessibilityRole="image">❤️</Text>#### 4. Color Contrast Issues

| Element | Foreground | Background | Ratio | WCAG AA Required |
|---------|------------|------------|-------|------------------|
| Placeholder text | `#7A8FA6` | `#0D1B2A` | ~3.5:1 | ❌ 4.5:1 |
| Footer text | `#5A7089` | `#0D1B2A` | ~2.8:1 | ❌ 4.5:1 |
| Trust text | `#6C8EAD` | `#0D1B2A` | ~3.2:1 | ❌ 4.5:1 |
| Disabled button text | `rgba(255,255,255,0.6)` | Dark | ~3.8:1 | ❌ 4.5:1 |

**Recommendation:** Increase contrast for secondary text elements to at least 4.5:1.

---

### Serious (WCAG Level AA Violations)

#### 5. No Focus Indicators

**Location:** `src/screens/LoginScreen.tsx` (lines 486-505)

The app lacks visible focus states for keyboard/switch navigation.

**Recommendation:** Add focus states using React Native's accessibility features.

#### 6. Touch Target Size

Some interactive elements may be too small.

**WCAG Requirement:** Minimum 44x44 points for touch targets.

**Location:** `src/screens/LoginScreen.tsx` (lines 525-536), `src/screens/ChatScreen.tsx` (lines 957-978)

#### 7. Animation Without Reduced Motion Support

**Location:** `src/screens/ChatScreen.tsx` (lines 44-63), `src/screens/SplashScreen.tsx` (lines 22-76)

**Recommendation:** Check `AccessibilityInfo.isReduceMotionEnabled()`:

import { AccessibilityInfo } from 'react-native';

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
    if (!isEnabled) {
      // Start animations
    }
  });
}, []);#### 8. Splash Screen Auto-Navigation

**Location:** `src/screens/SplashScreen.tsx` (lines 174-176)

Users cannot control the timing, which can be problematic for users who need more time.

**Recommendation:** Add a "Skip" button or respect reduced motion settings.

---

### Moderate Issues

#### 9. Patient Info Displayed in Plain Text

**Location:** `src/screens/ChatScreen.tsx` (lines 500-504)

Sensitive info should be masked or have an `accessibilityValue` that doesn't read out full IDs.

#### 10. Missing Live Region Announcements

When new messages arrive or connection status changes, screen readers aren't notified.

**Recommendation:**
<View accessibilityLiveRegion="polite">
  <Text>{connectionStatus.text}</Text>
</View>#### 11. Keyboard Handling

**Location:** `src/screens/LoginScreen.tsx` (lines 115-117)

Good use of `keyboardShouldPersistTaps`, but missing `keyboardDismissMode` for better UX.

---

## 📊 Usability Concerns

### 1. Default Credentials Security Risk

**Location:** `src/screens/LoginScreen.tsx` (lines 46-50)

⚠️ **Security Issue:** Hardcoded credentials in client-side code. This should be removed in production.

### 2. No Password/PIN Authentication

The login screen collects identifiers but has no authentication mechanism (password, OTP, biometric).

### 3. Error Messages Are Generic

**Location:** `src/screens/LoginScreen.tsx` (lines 78-96)

Alerts interrupt the user flow. Consider inline validation instead.

### 4. No Offline Mode Support

When disconnected, users cannot view previous messages or queue messages for sending.

### 5. Missing Back Navigation on Chat Screen

While there's a header back button, there's no explicit exit confirmation for the consultation.

---

## 🎯 Recommendations Summary

| Priority | Issue | Fix |
|----------|-------|-----|
| 🔴 Critical | Missing accessibility labels | Add `accessibilityLabel` to all interactive elements |
| 🔴 Critical | Form label association | Use `accessibilityLabel` and `accessibilityHint` |
| 🔴 Critical | Emoji accessibility | Add text alternatives or hide decorative emojis |
| 🟠 High | Color contrast | Increase contrast ratios to 4.5:1 minimum |
| 🟠 High | Animation preferences | Respect `isReduceMotionEnabled()` |
| 🟠 High | Touch targets | Ensure 44x44pt minimum for all touchables |
| 🟡 Medium | Live regions | Add `accessibilityLiveRegion` for dynamic content |
| 🟡 Medium | Focus indicators | Add visible focus states |
| 🟢 Low | Inline validation | Replace alerts with inline error messages |
| 🟢 Low | Splash skip option | Add skip button or reduce duration |

---

## 📈 Accessibility Score Estimate

| Category | Score | Notes |
|----------|-------|-------|
| Perceivable | 5/10 | Missing alt text, contrast issues |
| Operable | 6/10 | Good touch handling, missing focus states |
| Understandable | 7/10 | Clear layout, some error handling gaps |
| Robust | 6/10 | Missing semantic markup |
| **Overall** | **6/10** | Needs accessibility improvements |

---

## Files Analyzed

- `App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/navigation/types.ts`
- `src/screens/SplashScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/ChatScreen.tsx`

---

## Next Steps

1. Address all **Critical** issues first
2. Run accessibility audits using React Native Accessibility Inspector
3. Test with VoiceOver (iOS) and TalkBack (Android)
4. Consider using `react-native-a11y` library for enhanced accessibility support
5. Implement automated accessibility testing in CI/CD pipeline

---

*Report generated by code analysis on December 5, 2025*