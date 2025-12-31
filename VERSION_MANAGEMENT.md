# Version Management Guide

## Auto-Increment Version Script

This project includes an automated version increment script that updates version numbers across all necessary files.

## Usage

### Increment Patch Version (Bug Fixes)
```bash
npm run version:patch
```
Example: `1.0.0` → `1.0.1`

### Increment Minor Version (New Features)
```bash
npm run version:minor
```
Example: `1.0.0` → `1.1.0`

### Increment Major Version (Breaking Changes)
```bash
npm run version:major
```
Example: `1.0.0` → `2.0.0`

## What Gets Updated

The script automatically updates:

1. **app.json**
   - `expo.version` - Main version number
   - `expo.ios.buildNumber` - iOS build number (increments by 1)
   - `expo.android.versionCode` - Android version code (increments by 1)

2. **package.json**
   - `version` - Package version (synced with app.json)

## Version Numbering

- **Major**: Breaking changes, major feature additions
- **Minor**: New features, significant improvements
- **Patch**: Bug fixes, small improvements

## Build Numbers

- **iOS Build Number**: Increments with every version bump (required by App Store)
- **Android Version Code**: Increments with every version bump (required by Play Store)

## Example Workflow

```bash
# Make bug fixes
npm run version:patch
# Output: Version 1.0.0 → 1.0.1

# Add new features
npm run version:minor
# Output: Version 1.0.1 → 1.1.0

# Major update
npm run version:major
# Output: Version 1.1.0 → 2.0.0
```

## Manual Version Update

If you need to set a specific version manually, edit:
- `app.json` → `expo.version`
- `app.json` → `expo.ios.buildNumber`
- `app.json` → `expo.android.versionCode`
- `package.json` → `version`

## Notes

- Always commit version changes before building
- Version numbers must follow semantic versioning (X.Y.Z)
- Build numbers must always increment (can't go backwards)
- The app displays version from `Constants.expoConfig.version` automatically


