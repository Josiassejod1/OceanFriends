# In-App Purchase Setup Guide

## Overview
The app now includes in-app purchase functionality using `expo-iap`. This guide explains how to set it up for production.

## Installation

First, install the required package:
```bash
npm install expo-iap
```

Then, add the plugin to your `app.json`:
```json
{
  "expo": {
    "plugins": ["expo-iap"]
  }
}
```

## Product Configuration

### iOS (App Store Connect)
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create a new **Non-Consumable** product
3. Set the Product ID to: `unlock_all_boards`
4. Set the price to $2.99 (or your desired price)
5. Add a display name and description
6. Submit for review along with your app

### Android (Google Play Console)
1. Go to Google Play Console → Your App → Monetize → Products → In-app products
2. Create a new **Managed product** (non-consumable)
3. Set the Product ID to: `unlock_all_boards`
4. Set the price to $2.99 (or your desired price)
5. Add a title and description
6. Activate the product

## Product ID
The app uses a single product ID for unlocking all boards:
- **Product ID**: `unlock_all_boards`

## Testing

### iOS Sandbox Testing
1. Create a sandbox tester account in App Store Connect
2. Sign out of your Apple ID on the device
3. Run the app and attempt a purchase
4. Sign in with the sandbox tester account when prompted

### Android Testing
1. Add test accounts in Google Play Console → Settings → License testing
2. Upload the app as an internal test track
3. Test purchases will be automatically handled

## Implementation Details

The IAP functionality is implemented in:
- `src/utils/iapUtils.js` - Core IAP functions using `expo-iap`
- `src/components/BoardSelection.js` - UI integration

### Key Functions:
- `initializeIAP()` - Connects to the store
- `purchaseUnlockAll()` - Initiates purchase
- `restorePurchases()` - Restores previous purchases
- `hasUnlockedAll()` - Checks purchase status
- `getPurchaseInfo()` - Gets product price/info

### Using expo-iap:
The implementation uses `expo-iap` which provides:
- Unified API for iOS and Android
- Built-in receipt validation
- Modern TypeScript support
- Compatibility with StoreKit 2 and latest Android Billing Library

## Purchase Flow

1. User taps "Unlock All" button
2. App checks if IAP is available
3. Shows confirmation dialog with price
4. User confirms → Native purchase dialog appears
5. User completes purchase → All boards unlock
6. Purchase is saved locally and restored on app restart

## Purchase Restoration

The app automatically restores purchases when:
- App launches
- User returns to the board selection screen

This ensures users don't lose access after reinstalling the app.

## Error Handling

The app gracefully handles:
- IAP not available (simulator, etc.)
- Purchase cancellation
- Network errors
- Store connection failures

If IAP is unavailable, the app continues to function normally (boards remain locked).

## Production Checklist

- [ ] Install `expo-in-app-purchases` package
- [ ] Configure product in App Store Connect (iOS)
- [ ] Configure product in Google Play Console (Android)
- [ ] Test purchases in sandbox/test environment
- [ ] Verify purchase restoration works
- [ ] Test on physical devices (not just simulators)
- [ ] Submit app with IAP products for review

## Notes

- The app uses a single "Unlock All" purchase model (simpler than individual board purchases)
- All purchases are non-consumable (permanent)
- Purchase status is stored locally and synced with store receipts
- The app will work even if IAP is unavailable (graceful degradation)

