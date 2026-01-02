# IAP Testing Guide - Ocean Friends Jigsaw

## 📋 Prerequisites

Before testing IAP, you need to:

1. **Configure the product in stores** (see setup steps below)
2. **Build the app** (IAP doesn't work in Expo Go - need development build)
3. **Use a real device** (IAP doesn't work on simulators/emulators)

---

## 🍎 iOS Testing (App Store Connect)

### Step 1: Create Product in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **My Apps** → **Your App** → **Features** → **In-App Purchases**
3. Click **+** to create a new product
4. Select **Non-Consumable** (since it's a permanent unlock)
5. Fill in:
   - **Product ID**: `unlock_all_boards` (must match exactly)
   - **Reference Name**: "Unlock All Boards"
   - **Price**: Choose your price (e.g., $4.99)
   - **Display Name**: "Unlock All Boards"
   - **Description**: "Unlock all premium puzzle boards"
6. Click **Save**
7. **Status**: Should show "Ready to Submit" (you can test before submitting)

### Step 2: Create Sandbox Tester Account

1. Go to **Users and Access** → **Sandbox Testers**
2. Click **+** to add a new tester
3. Fill in:
   - Email (use a test email, not your real one)
   - Password
   - Country/Region
4. **Important**: Use a unique email that's NOT associated with any Apple ID

### Step 3: Test on Device

1. **Sign out of your Apple ID** on the test device:
   - Settings → [Your Name] → Sign Out
   - Or use a different device

2. **Build and install the app**:
   ```bash
   # Using EAS Build
   eas build --profile development --platform ios
   
   # Or using Expo Development Build
   npx expo run:ios --device
   ```

3. **Test the purchase flow**:
   - Open the app
   - Try to unlock a premium board
   - When prompted, sign in with your **sandbox tester account**
   - Complete the purchase (it's free in sandbox)
   - Verify all boards unlock

4. **Test restore purchases**:
   - Go to Settings → Restore Purchases
   - Should restore your purchase
   - All boards should remain unlocked

### Step 4: Verify Purchase

- Check that boards are unlocked
- Close and reopen the app
- Verify purchase persists
- Check console logs for any errors

---

## 🤖 Android Testing (Google Play Console)

### Step 1: Create Product in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to: **Your App** → **Monetize** → **Products** → **In-app products**
3. Click **Create product**
4. Fill in:
   - **Product ID**: `unlock_all_boards` (must match exactly)
   - **Name**: "Unlock All Boards"
   - **Description**: "Unlock all premium puzzle boards"
   - **Price**: Set your price
   - **Status**: Set to **Active**
5. Click **Save**

### Step 2: Set Up Internal Testing

1. Go to **Testing** → **Internal testing**
2. Create a new release or use existing
3. Upload your app (APK or AAB)
4. Add testers (your email or test accounts)
5. **License Testing** (for easier testing):
   - Go to **Settings** → **License testing**
   - Add your test email addresses
   - Purchases will be approved automatically

### Step 3: Test on Device

1. **Join the internal test track**:
   - Use the opt-in URL from Play Console
   - Or install from Play Store (if you're a tester)

2. **Build and install**:
   ```bash
   # Using EAS Build
   eas build --profile development --platform android
   
   # Or using Expo Development Build
   npx expo run:android --device
   ```

3. **Test the purchase flow**:
   - Open the app
   - Try to unlock a premium board
   - Complete the purchase (free for license testers)
   - Verify all boards unlock

4. **Test restore purchases**:
   - Go to Settings → Restore Purchases
   - Should restore your purchase
   - All boards should remain unlocked

---

## 🧪 Testing Checklist

### Purchase Flow
- [ ] Product loads correctly (price displays)
- [ ] Purchase dialog appears
- [ ] Purchase completes successfully
- [ ] All boards unlock after purchase
- [ ] Purchase persists after app restart
- [ ] Purchase persists after app reinstall

### Restore Purchases
- [ ] Restore button works
- [ ] Restore finds previous purchases
- [ ] Boards unlock after restore
- [ ] Works after app reinstall

### Error Handling
- [ ] Handles purchase cancellation gracefully
- [ ] Shows appropriate error messages
- [ ] App continues working if IAP unavailable
- [ ] Handles network errors

### Edge Cases
- [ ] Test on different devices
- [ ] Test with no internet (should show error)
- [ ] Test with slow internet
- [ ] Test multiple purchases (should only charge once)
- [ ] Test restore on fresh install

---

## 🐛 Common Issues & Solutions

### Issue: "Product not found"
**Solution:**
- Verify product ID matches exactly: `unlock_all_boards`
- Check product is active/published in store
- Wait a few minutes after creating product (propagation delay)
- Ensure you're testing on the correct platform (iOS vs Android)

### Issue: "IAP not available"
**Solution:**
- IAP doesn't work in Expo Go - need development build
- IAP doesn't work on simulators - need real device
- Check you're signed in to correct account (sandbox for iOS)
- Verify app bundle ID matches store configuration

### Issue: "Purchase succeeds but boards don't unlock"
**Solution:**
- Check console logs for errors
- Verify `savePurchase()` is being called
- Check AsyncStorage for purchase data
- Verify `loadUnlockedBoards()` runs after purchase

### Issue: "Restore doesn't work"
**Solution:**
- Ensure you've made a purchase first
- Check you're signed in with same account
- Verify `restorePurchases()` is being called
- Check network connection

---

## 🔍 Debugging Tips

### Enable Console Logging

Add these logs to help debug:

```javascript
// In iapUtils.js
console.log('IAP Available:', await IAP.isAvailableAsync());
console.log('Products:', await getProducts());
console.log('Purchase Result:', result);
console.log('Restore Result:', await restorePurchases());
```

### Check Purchase Status

```javascript
// Check if purchase is saved locally
import AsyncStorage from '@react-native-async-storage/async-storage';
const purchases = await AsyncStorage.getItem('@purchases');
console.log('Saved purchases:', purchases);
```

### Test Without Store (Development)

You can temporarily bypass IAP for testing:

```javascript
// In BoardSelection.js, temporarily unlock all for testing
const isUnlocked = (boardId) => {
  // Temporarily unlock all for testing
  if (__DEV__) return true;
  
  // Normal logic
  const index = ALL_BOARDS.findIndex(b => b.id === boardId);
  if (index < FREE_BOARDS_COUNT) return true;
  return unlockedBoards.has(boardId);
};
```

---

## 📱 Testing on Real Devices

### iOS Device Requirements:
- iOS 11.0 or later
- Signed in with sandbox tester account (or signed out)
- Development build installed
- Internet connection

### Android Device Requirements:
- Android 5.0 (API 21) or later
- Google Play Services installed
- Development build installed
- Internet connection
- Signed in to Google account (for license testing)

---

## ✅ Quick Test Script

1. **Build app for device**:
   ```bash
   npx expo run:ios --device  # iOS
   npx expo run:android --device  # Android
   ```

2. **Test purchase**:
   - Open app
   - Try to unlock premium board
   - Complete purchase
   - Verify unlock

3. **Test restore**:
   - Settings → Restore Purchases
   - Verify restore works

4. **Test persistence**:
   - Close app completely
   - Reopen app
   - Verify boards still unlocked

---

## 🚀 Production Checklist

Before submitting to stores:

- [ ] Product configured in App Store Connect (iOS)
- [ ] Product configured in Google Play Console (Android)
- [ ] Tested purchase flow on real iOS device
- [ ] Tested purchase flow on real Android device
- [ ] Tested restore purchases on both platforms
- [ ] Verified purchase persists after reinstall
- [ ] Tested error handling (cancellation, network errors)
- [ ] Removed any debug/test code
- [ ] Verified product IDs match exactly

---

## 📞 Need Help?

If you encounter issues:

1. Check console logs for error messages
2. Verify product configuration in stores
3. Ensure you're using a development build (not Expo Go)
4. Test on a real device (not simulator)
5. Check network connection
6. Verify you're signed in with correct test account

---

## 🎯 Your Current Setup

**Product ID**: `unlock_all_boards`

**Next Steps**:
1. Create product in App Store Connect (iOS)
2. Create product in Google Play Console (Android)
3. Build development build for device
4. Test purchase flow
5. Test restore purchases
6. Submit for review

Good luck! 🚀

