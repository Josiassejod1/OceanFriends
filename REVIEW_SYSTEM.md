# Parent Review System

## Overview

The app includes a built-in review system that allows parents to rate and review the app directly from the Settings screen.

## Features

### 1. **Review Button in Settings**
- Located in the "About" section of Settings
- Prominent "⭐ Rate This App" button
- Opens native App Store/Play Store review page

### 2. **Smart Review Prompt**
- Shows friendly alert before opening store
- Explains why reviews help
- Gives option to decline gracefully

### 3. **Platform-Specific URLs**
- **iOS**: Opens App Store review page
- **Android**: Opens Google Play Store review page
- Automatically detects platform

## Implementation

### Settings Screen Integration
The review button is automatically added to the Settings screen in the "About" section.

### Version Display
The app version is automatically displayed from `app.json`, so it stays in sync with your version numbers.

## Configuration

### Before Publishing

1. **Get App Store ID (iOS)**
   - After publishing to App Store Connect, get your App ID
   - Update `src/utils/reviewUtils.js`:
   ```javascript
   const appId = 'YOUR_ACTUAL_APP_ID'; // Replace placeholder
   ```

2. **Android Package Name**
   - Already configured in `app.json` → `android.package`
   - Automatically used for Play Store URL

## How It Works

1. Parent opens Settings (🛟 icon)
2. Scrolls to "About" section
3. Sees current app version
4. Taps "⭐ Rate This App" button
5. Alert appears: "Love the App? Your feedback helps us improve!"
6. Parent chooses:
   - **"Not Now"**: Closes alert, no action
   - **"Rate App"**: Opens App Store/Play Store review page

## Best Practices

### When to Prompt for Reviews

**Good Times:**
- After completing a puzzle successfully
- After unlocking new content
- After positive interactions

**Bad Times:**
- Immediately on app launch
- After errors or crashes
- Too frequently (annoying)

### Current Implementation

Currently, the review button is always visible in Settings. This is a good approach because:
- ✅ Parents can review when they want
- ✅ Not intrusive or annoying
- ✅ Easy to find when needed
- ✅ Respects user choice

### Future Enhancements (Optional)

You could add:
- Smart timing (prompt after X puzzles completed)
- Rate limiting (don't prompt if reviewed recently)
- In-app feedback form before directing to store
- Track review prompt impressions

## App Store Guidelines

### iOS
- Must use native App Store review flow
- Cannot incentivize reviews
- Cannot show custom review UI (must use native)

### Android
- Must use Google Play review flow
- Cannot incentivize reviews
- Can show custom UI before opening Play Store

## Testing

### Before Publishing
- Test that URLs are correct
- Verify button appears in Settings
- Test alert appears correctly
- Test "Not Now" closes gracefully

### After Publishing
- Update App Store ID in code
- Test on real device
- Verify store opens correctly
- Test on both iOS and Android

## Code Location

- **Review Utils**: `src/utils/reviewUtils.js`
- **Settings Integration**: `src/components/Settings.js` (About section)
- **Version Display**: Automatically from `app.json`

## Example User Flow

```
Parent opens app
  ↓
Taps 🛟 (Settings)
  ↓
Scrolls to "About"
  ↓
Sees: "Ocean Friends Jigsaw"
      "Version 1.0.0"
      "⭐ Rate This App" button
  ↓
Taps "⭐ Rate This App"
  ↓
Alert: "Love the App? Your feedback helps us improve!"
  ↓
Taps "Rate App"
  ↓
App Store/Play Store opens to review page
  ↓
Parent leaves review
```

## Benefits

1. **Easy Access**: Parents can review anytime from Settings
2. **Non-Intrusive**: Doesn't interrupt gameplay
3. **Professional**: Uses native store review flows
4. **Trustworthy**: Parents trust native review systems
5. **Compliant**: Follows App Store/Play Store guidelines

## Notes

- Reviews are crucial for app store ranking
- More reviews = better visibility
- Positive reviews help conversion
- Responding to reviews shows engagement

