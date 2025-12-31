#!/usr/bin/env node

/**
 * Theme Generator Script
 * Creates a new themed app from the base template
 * 
 * Usage: node scripts/create-theme.js <theme-name> "<Display Name>" "<color1,color2,color3>"
 * Example: node scripts/create-theme.js winter "Winter Friends" "#E3F2FD,#B3E5FC,#81D4FA"
 */

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const BASE_APP_JSON = path.join(__dirname, '..', 'app.json');
const BASE_BOARD_SELECTION = path.join(__dirname, '..', 'src', 'components', 'BoardSelection.js');

function createTheme(themeName, displayName, colors) {
  const themeDir = path.join(THEMES_DIR, themeName);
  
  // Create theme directory
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }
  
  if (fs.existsSync(themeDir)) {
    console.error(`❌ Theme "${themeName}" already exists!`);
    process.exit(1);
  }
  
  fs.mkdirSync(themeDir, { recursive: true });
  fs.mkdirSync(path.join(themeDir, 'assets', 'boards'), { recursive: true });
  
  // Read base app.json
  const appJson = JSON.parse(fs.readFileSync(BASE_APP_JSON, 'utf8'));
  
  // Generate bundle identifiers
  const bundleIdBase = themeName.toLowerCase().replace(/\s+/g, '');
  const bundleId = `com.${bundleIdBase}friends.jigsaw`;
  
  // Update app.json for theme
  appJson.expo.name = displayName;
  appJson.expo.slug = `${bundleIdBase}-friends-jigsaw`;
  appJson.expo.version = '1.0.0';
  appJson.expo.ios.bundleIdentifier = bundleId;
  appJson.expo.ios.buildNumber = '1.0.0';
  appJson.expo.android.package = bundleId;
  appJson.expo.android.versionCode = 1;
  appJson.expo.description = `${displayName} - Jigsaw Puzzles! Solve beautiful ${themeName}-themed puzzles...`;
  
  // Save theme app.json
  fs.writeFileSync(
    path.join(themeDir, 'app.json'),
    JSON.stringify(appJson, null, 2) + '\n'
  );
  
  // Create theme config
  const themeConfig = {
    name: displayName,
    themeName: themeName,
    colors: colors.split(','),
    bundleId: bundleId,
    slug: `${bundleIdBase}-friends-jigsaw`,
    createdAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    path.join(themeDir, 'theme-config.json'),
    JSON.stringify(themeConfig, null, 2) + '\n'
  );
  
  // Create README for theme
  const readme = `# ${displayName}

## Theme: ${themeName}

### Assets Needed
- [ ] 14 puzzle images (1024x1024 or larger)
- [ ] App icon (1024x1024)
- [ ] Splash screen image
- [ ] Optional: Custom sound effects

### Colors
${colors.split(',').map((c, i) => `- Color ${i + 1}: ${c.trim()}`).join('\n')}

### Bundle ID
${bundleId}

### Next Steps
1. Add puzzle images to assets/boards/
2. Add app icon and splash screen
3. Update BoardSelection.js with new board names
4. Test the theme
5. Build and submit to stores
`;
  
  fs.writeFileSync(path.join(themeDir, 'README.md'), readme);
  
  console.log(`✅ Theme "${displayName}" created!`);
  console.log(`   Location: ${themeDir}`);
  console.log(`   Bundle ID: ${bundleId}`);
  console.log(`   Colors: ${colors}`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Add 14 puzzle images to: ${path.join(themeDir, 'assets', 'boards')}`);
  console.log(`   2. Add app icon and splash screen`);
  console.log(`   3. Update BoardSelection.js with new board names`);
  console.log(`   4. Test and build`);
}

// Main
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('❌ Usage: node scripts/create-theme.js <theme-name> "<Display Name>" "<color1,color2,color3>"');
  console.error('   Example: node scripts/create-theme.js winter "Winter Friends" "#E3F2FD,#B3E5FC,#81D4FA"');
  process.exit(1);
}

const [themeName, displayName, colors] = args;

try {
  createTheme(themeName, displayName, colors);
} catch (error) {
  console.error('❌ Error creating theme:', error.message);
  process.exit(1);
}


