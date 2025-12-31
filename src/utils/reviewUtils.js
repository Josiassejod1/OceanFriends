import { Linking, Platform, Alert } from 'react-native';

// Try to import expo-constants, fallback if not available
let Constants = null;
try {
  Constants = require('expo-constants').default;
} catch (e) {
  // Fallback if expo-constants not available
  Constants = {
    expoConfig: {
      ios: { bundleIdentifier: 'com.oceanfriends.jigsaw' },
      android: { package: 'com.oceanfriends.jigsaw' },
      version: '1.0.0',
    },
  };
}

/**
 * Get app store URLs for rating
 */
export function getStoreUrl() {
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 
                   Constants.expoConfig?.android?.package;
  
  if (Platform.OS === 'ios') {
    // iOS App Store URL format
    const appId = 'YOUR_APP_ID'; // Replace with actual App Store ID when available
    return `https://apps.apple.com/app/id${appId}?action=write-review`;
  } else if (Platform.OS === 'android') {
    // Google Play Store URL format
    const packageName = Constants.expoConfig?.android?.package || bundleId;
    return `https://play.google.com/store/apps/details?id=${packageName}`;
  }
  
  return null;
}

/**
 * Open app store for rating/review
 */
export async function requestReview() {
  try {
    const storeUrl = getStoreUrl();
    
    if (!storeUrl) {
      Alert.alert(
        'Review Not Available',
        'App store information is not configured yet. Please check back after the app is published.',
        [{ text: 'OK' }]
      );
      return;
    }

    const canOpen = await Linking.canOpenURL(storeUrl);
    
    if (canOpen) {
      await Linking.openURL(storeUrl);
    } else {
      Alert.alert(
        'Unable to Open Store',
        'Could not open the app store. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error opening store:', error);
    Alert.alert(
      'Error',
      'Unable to open the app store. Please try again later.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Show review prompt with explanation
 */
export function showReviewPrompt() {
  Alert.alert(
    'Love the App?',
    'Your feedback helps us improve! Would you like to leave a review on the App Store?',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Rate App',
        onPress: () => requestReview(),
      },
    ]
  );
}

