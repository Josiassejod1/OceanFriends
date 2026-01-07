# Testing IAP with Developer Build

## 🎯 Quick Start

IAP **does not work** in Expo Go. You **must** use a development build to test in-app purchases.

---

## 📱 Option 1: Local Development Build (Recommended for Testing)

### iOS

1. **Prerequisites:**
   - macOS with Xcode installed
   - Apple Developer account (free account works for testing)
   - Physical iOS device (IAP doesn't work on simulator)

2. **Build and Install:**
   ```bash
   # Install dependencies
   npm install
   
   # Build and run on connected device
   npx expo run:ios --device
   ```
   
   This will:
   - Build a development client
   - Install it on your connected device
   - Start the Metro bundler

3. **First Time Setup:**
   - You may need to trust the developer certificate on your device
   - Go to Settings → General → VPN & Device Management → Trust Developer

### Android

1. **Prerequisites:**
   - Android Studio installed (or Android SDK)
   - Physical Android device with USB debugging enabled
   - OR Android emulator with Google Play Services (limited IAP support)

2. **Build and Install:**
   ```bash
   # Install dependencies
   npm install
   
   # Build and run on connected device
   npx expo run:android --device
   ```
   
   Or for emulator:
   ```bash
   npx expo run:android
   ```

---

## ☁️ Option 2: EAS Build (Cloud Build)

### Setup EAS Build

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS (if not already done):**
   ```bash
   eas build:configure
   ```

### Build Development Client

**For iOS:**
```bash
eas build --profile development --platform ios
```

**For Android:**
```bash
eas build --profile development --platform android
```

**For Both:**
```bash
eas build --profile development --platform all
```

### Install the Build

1. **After build completes**, you'll get a download link
2. **iOS**: Download and install via TestFlight or direct install
3. **Android**: Download APK and install on device

---

## 🧪 Testing IAP with Developer Build

### Step 1: Configure Products in Stores

**iOS (App Store Connect):**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **My Apps** → **Your App** → **Features** → **In-App Purchases**
3. Create product with ID: `unlock_all_boards`
4. Set as **Non-Consumable**
5. Create **Sandbox Tester** account (Users and Access → Sandbox Testers)

**Android (Google Play Console):**
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to: **Your App** → **Monetize** → **Products** → **In-app products**
3. Create product with ID: `unlock_all_boards`
4. Set as **Managed product** (non-consumable)
5. Set status to **Active**
6. Add testers in **Settings** → **License testing**

### Step 2: Test Purchase Flow

**iOS:**
1. **Sign out** of your Apple ID on the test device (or use sandbox tester)
2. Open your development build app
3. Try to unlock a premium board
4. When prompted, sign in with **sandbox tester account**
5. Complete purchase (free in sandbox)
6. Verify boards unlock

**Android:**
1. Make sure you're signed in with a test account (from License testing)
2. Open your development build app
3. Try to unlock a premium board
4. Complete purchase (free for license testers)
5. Verify boards unlock

### Step 3: Test Restore Purchases

1. Go to **Settings** → **Restore Purchases**
2. Verify it finds your previous purchase
3. Verify boards remain unlocked

### Step 4: Test Persistence

1. Close the app completely
2. Reopen the app
3. Verify boards are still unlocked
4. (Optional) Uninstall and reinstall app
5. Use "Restore Purchases" to restore

---

## 🔍 Debugging Tips

### Enable Debug Logging

The app already includes console logging. To see IAP logs:

**iOS:**
```bash
# View device logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "OceanFriends"'

# Or use Xcode → Window → Devices and Simulators → View Device Logs
```

**Android:**
```bash
# View logs via ADB
adb logcat | grep -i "iap\|purchase"

# Or use Android Studio Logcat
```

### Check Purchase Status

Add this temporary debug code to check purchase state:

```javascript
// In BoardSelection.js, add to useEffect
useEffect(() => {
  const checkPurchase = async () => {
    const hasUnlocked = await iapUtils.hasUnlockedAll();
    console.log('Has unlocked all:', hasUnlocked);
    
    const purchaseInfo = await iapUtils.getPurchaseInfo();
    console.log('Purchase info:', purchaseInfo);
  };
  checkPurchase();
}, []);
```

### Common Issues

**"Product not found"**
- Wait 5-10 minutes after creating product (propagation delay)
- Verify product ID matches exactly: `unlock_all_boards`
- Check product is active/published

**"IAP not available"**
- Ensure you're using development build (not Expo Go)
- Use physical device (not simulator for iOS)
- Check internet connection

**"Purchase succeeds but doesn't unlock"**
- Check console logs for errors
- Verify `savePurchase()` is called
- Check AsyncStorage: `@purchases` key

---

## 📋 Testing Checklist

- [ ] Development build installed on device
- [ ] Product created in App Store Connect (iOS)
- [ ] Product created in Google Play Console (Android)
- [ ] Sandbox tester account created (iOS)
- [ ] License testing configured (Android)
- [ ] Purchase flow works
- [ ] Purchase unlocks boards
- [ ] Purchase persists after app restart
- [ ] Restore purchases works
- [ ] Restore works after reinstall
- [ ] Error handling works (cancellation, network errors)
- [ ] Price displays correctly

---

## 🚀 Development Workflow

### Daily Development

1. **Start Metro bundler:**
   ```bash
   npx expo start --dev-client
   ```

2. **Open app on device** (already installed from previous build)

3. **Make code changes** - they'll hot reload automatically

4. **Test IAP** - works because you're using development build

### When You Need to Rebuild

Rebuild only when:
- Adding new native dependencies
- Changing `app.json` config
- Changing `eas.json` build config
- Updating Expo SDK version

```bash
# Rebuild iOS
npx expo run:ios --device

# Rebuild Android
npx expo run:android --device
```

---

## 🎯 Your Current Setup

**Product ID**: `unlock_all_boards`

**Next Steps:**
1. ✅ Code updated to use `expo-iap` API
2. ⏳ Create product in App Store Connect
3. ⏳ Create product in Google Play Console
4. ⏳ Build development build
5. ⏳ Test purchase flow
6. ⏳ Test restore purchases

---

## 💡 Pro Tips

1. **Keep sandbox tester accounts separate** - don't use your real Apple ID
2. **Test on multiple devices** - ensure it works across devices
3. **Test restore after uninstall** - critical for user experience
4. **Monitor console logs** - catch errors early
5. **Test error scenarios** - cancellation, network errors, etc.

---

## 📚 Resources

- [expo-iap Documentation](https://hyochan.github.io/expo-iap/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Sandbox Testing Guide](https://developer.apple.com/in-app-purchase/)
- [Android License Testing](https://developer.android.com/google/play/billing/test)

---

## 🆘 Troubleshooting

**Build fails:**
- Check `eas.json` configuration
- Verify app.json has `expo-iap` plugin
- Check Expo SDK version compatibility

**IAP still doesn't work:**
- Verify you're using development build (not Expo Go)
- Check product is configured correctly in stores
- Wait for product propagation (can take 10+ minutes)
- Verify bundle ID matches store configuration

**Need help?**
- Check console logs first
- Review IAP_TESTING_GUIDE.md for detailed steps
- Check expo-iap GitHub issues

