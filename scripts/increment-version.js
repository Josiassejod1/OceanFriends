#!/usr/bin/env node

/**
 * Auto-increment version script
 * Usage: node scripts/increment-version.js [major|minor|patch]
 * Default: patch
 */

const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '..', 'app.json');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  if (type === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    // patch
    parts[2]++;
  }
  
  return parts.join('.');
}

function incrementBuildNumber(buildNumber) {
  return (parseInt(buildNumber) || 0) + 1;
}

function incrementVersionCode(versionCode) {
  return (parseInt(versionCode) || 0) + 1;
}

function updateAppJson(type) {
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  
  // Update version
  const oldVersion = appJson.expo.version;
  const newVersion = incrementVersion(oldVersion, type);
  appJson.expo.version = newVersion;
  
  // Update iOS build number
  if (appJson.expo.ios) {
    appJson.expo.ios.buildNumber = incrementBuildNumber(appJson.expo.ios.buildNumber).toString();
  }
  
  // Update Android version code
  if (appJson.expo.android) {
    appJson.expo.android.versionCode = incrementVersionCode(appJson.expo.android.versionCode);
  }
  
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');
  
  console.log('✅ Updated app.json:');
  console.log(`   Version: ${oldVersion} → ${newVersion}`);
  if (appJson.expo.ios) {
    console.log(`   iOS Build: ${appJson.expo.ios.buildNumber}`);
  }
  if (appJson.expo.android) {
    console.log(`   Android Version Code: ${appJson.expo.android.versionCode}`);
  }
  
  return newVersion;
}

function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`   package.json version: ${newVersion}`);
}

// Main
const type = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(type)) {
  console.error('❌ Invalid version type. Use: major, minor, or patch');
  process.exit(1);
}

try {
  const newVersion = updateAppJson(type);
  updatePackageJson(newVersion);
  console.log(`\n✅ Version incremented successfully!`);
  console.log(`   Type: ${type}`);
  console.log(`   New version: ${newVersion}`);
} catch (error) {
  console.error('❌ Error incrementing version:', error.message);
  process.exit(1);
}


