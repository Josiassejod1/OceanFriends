# Reskinning Guide - How to Create Seasonal/Themed Versions

## ✅ **Yes, you can easily reskin this app!**

The architecture is designed to be theme-agnostic. Here's what you need to change for different seasons/themes:

---

## 🎨 **What to Change for a New Theme**

### 1. **Puzzle Images** (Easiest - Just swap files)
**Location:** `assets/boards/`

**What to do:**
- Replace all puzzle images in `assets/boards/` folder
- Keep the same file naming convention (or update the `ALL_BOARDS` array)
- Recommended: 14 puzzle images (5 free, 9 premium)
- Format: PNG images, any size (will be scaled)

**Files to update:**
- `src/components/BoardSelection.js` - Update `ALL_BOARDS` array with new image names

---

### 2. **Colors & Gradients** (Quick - 5 minutes)
**Locations:**
- `src/components/BoardSelection.js` (line ~287)
- `src/components/Settings.js` (line ~168)
- `src/components/Puzzle.js` (background colors)

**Current Ocean Theme:**
```javascript
// BoardSelection.js - Ocean wave gradient
colors={['#E3F2FD', '#BBDEFB', '#90CAF9', '#BBDEFB', '#E3F2FD', '#BBDEFB', '#90CAF9']}
```

**Example Themes:**

**Winter Theme:**
```javascript
colors={['#E3F2FD', '#B3E5FC', '#81D4FA', '#B3E5FC', '#E3F2FD', '#B3E5FC', '#81D4FA']}
// Light blues/whites
```

**Spring Theme:**
```javascript
colors={['#F1F8E9', '#DCEDC8', '#C5E1A5', '#DCEDC8', '#F1F8E9', '#DCEDC8', '#C5E1A5']}
// Light greens
```

**Fall Theme:**
```javascript
colors={['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFE0B2', '#FFF3E0', '#FFE0B2', '#FFCC80']}
// Warm oranges
```

**Summer Theme:**
```javascript
colors={['#FFF9C4', '#FFF59D', '#FFF176', '#FFF59D', '#FFF9C4', '#FFF59D', '#FFF176']}
// Bright yellows
```

---

### 3. **App Metadata** (Quick - 10 minutes)
**Location:** `app.json`

**What to change:**
- `name`: App name
- `slug`: URL-friendly name
- `description`: App description
- `icon`: App icon image path
- `splash.image`: Splash screen image
- `ios.subtitle`: iOS subtitle
- `android.name`: Android app name
- `ios.bundleIdentifier`: Change for new app (e.g., `com.winterfriends.jigsaw`)
- `android.package`: Change for new app

**Example for Winter Theme:**
```json
{
  "expo": {
    "name": "Winter Friends",
    "slug": "winter-friends-jigsaw",
    "description": "Winter Friends - Snowy Jigsaw Puzzles! Solve beautiful winter-themed puzzles...",
    "icon": "./assets/boards/snowman.png",
    "ios": {
      "bundleIdentifier": "com.winterfriends.jigsaw",
      "subtitle": "Winter Jigsaw Puzzles"
    },
    "android": {
      "package": "com.winterfriends.jigsaw",
      "name": "Winter Friends: Snowy Jigsaw Puzzles"
    }
  }
}
```

---

### 4. **Text Content** (Quick - 5 minutes)
**Locations:**
- `src/components/BoardSelection.js`: Title "Choose a Puzzle"
- `src/components/Puzzle.js`: "Loading ocean friend..." → "Loading winter friend..."
- `src/components/Settings.js`: "Ocean Friends Jigsaw" → "Winter Friends Jigsaw"
- Any other theme-specific text

**Search for:**
- "ocean" / "Ocean"
- "Choose a Puzzle" (can stay generic)
- Loading messages
- Celebration messages

---

### 5. **Settings Icon** (Optional - 30 seconds)
**Location:** `src/components/BoardSelection.js` (line ~299)

**Current:** 🛟 (life ring - ocean theme)

**Theme Examples:**
- Winter: ❄️ or ⛄
- Spring: 🌸 or 🌺
- Fall: 🍂 or 🍁
- Summer: ☀️ or 🌻
- Generic: ⚙️ or 🎮

---

### 6. **Wooden Board Background** (Optional)
**Location:** `src/components/Puzzle.js`

**Current:** Uses `assets/boards/board.png` (wooden texture)

**Options:**
- Keep it (works for any theme)
- Replace with theme-appropriate texture
- Use solid color instead

---

### 7. **Sound Effects** (Optional)
**Location:** `assets/audio/`

**Current sounds:**
- `correct.mp3` - Piece placement
- `success.mp3` - Puzzle completion
- `bubble.wav` - Click sound

**Options:**
- Keep generic sounds (work for any theme)
- Replace with theme-appropriate sounds
- Winter: snow crunch, bell sounds
- Spring: bird chirps, nature sounds
- Fall: leaves rustling
- Summer: beach waves, seagulls

---

## 🚀 **Quick Reskinning Process**

### Step-by-Step (30-60 minutes):

1. **Prepare Assets** (15-30 min)
   - Create 14 puzzle images for new theme
   - Create app icon (1024x1024)
   - Create splash screen image
   - Optional: New sound effects

2. **Update Images** (5 min)
   - Replace files in `assets/boards/`
   - Update `ALL_BOARDS` array in `BoardSelection.js`

3. **Update Colors** (5 min)
   - Change gradient colors in `BoardSelection.js`
   - Change gradient colors in `Settings.js`
   - Update background colors in `Puzzle.js`

4. **Update Metadata** (5 min)
   - Edit `app.json` with new theme info
   - Change bundle identifiers for new app

5. **Update Text** (5 min)
   - Search and replace theme-specific text
   - Update loading messages
   - Update app name references

6. **Update Icon** (1 min)
   - Change settings icon emoji (optional)

7. **Test** (10 min)
   - Run app and verify everything works
   - Check all puzzles load
   - Test purchase flow

---

## 📋 **What Stays the Same (No Changes Needed)**

✅ **Core Game Mechanics**
- Drag & drop system
- Jigsaw piece generation
- Snapping logic
- Difficulty system (4, 9, 16 pieces)

✅ **Technical Systems**
- IAP integration code
- Settings functionality
- Parental controls
- Storage/persistence
- Audio system structure

✅ **UI Components**
- Grid layout
- Difficulty pills
- Lock/unlock system
- Celebration screen
- Settings modal

✅ **Game Logic**
- Piece placement logic
- Progress tracking
- Purchase flow
- All utility functions

---

## 🎯 **Theme Ideas**

### Seasonal Themes:
- **Winter Friends**: Snowmen, penguins, winter animals, snowflakes
- **Spring Friends**: Flowers, baby animals, butterflies, gardens
- **Summer Friends**: Beach scenes, ice cream, pool, vacation
- **Fall Friends**: Pumpkins, leaves, harvest, autumn animals

### Other Themes:
- **Farm Friends**: Farm animals, tractors, barns
- **Space Friends**: Planets, rockets, astronauts, aliens
- **Dinosaur Friends**: Dinosaurs, fossils, prehistoric scenes
- **Princess Friends**: Castles, princesses, fairy tales
- **Superhero Friends**: Superheroes, capes, masks

---

## 💡 **Pro Tips**

1. **Keep File Structure**
   - Maintain the same folder structure
   - Use consistent naming conventions
   - Keep same number of puzzles (14)

2. **Color Palette**
   - Choose 3-4 colors for gradients
   - Keep them light/low-stimulation (for kids)
   - Test contrast for readability

3. **Image Guidelines**
   - Use consistent art style
   - Keep images simple (for puzzle pieces)
   - Ensure good contrast
   - Test at different sizes

4. **Bundle Identifiers**
   - **Important**: Change bundle IDs for each theme
   - Each theme = separate app in stores
   - Format: `com.[theme]friends.jigsaw`

5. **Code Organization**
   - Consider creating a `theme.js` config file
   - Centralize colors, text, and assets
   - Makes reskinning even easier

---

## 🔧 **Advanced: Theme Configuration File**

For easier reskinning, you could create a theme config:

**Create:** `src/config/theme.js`
```javascript
export const THEME = {
  name: 'Ocean Friends',
  colors: {
    gradient: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#BBDEFB', '#E3F2FD', '#BBDEFB', '#90CAF9'],
    background: '#F5F3F0',
  },
  icon: '🛟',
  loadingText: 'Loading ocean friend...',
  boards: [
    { id: 'clown', name: 'Clown Fish', image: require('../../assets/boards/clown.png') },
    // ... etc
  ],
};
```

Then import and use throughout the app. Makes reskinning a single file change!

---

## ✅ **Reskinning Checklist**

- [ ] Replace puzzle images (14 images)
- [ ] Update `ALL_BOARDS` array
- [ ] Change gradient colors (2 locations)
- [ ] Update `app.json` metadata
- [ ] Change bundle identifiers
- [ ] Update text content
- [ ] Change settings icon (optional)
- [ ] Replace app icon & splash screen
- [ ] Test all puzzles load
- [ ] Test purchase flow
- [ ] Verify colors look good
- [ ] Check all text is updated

---

## 🎉 **Bottom Line**

**Yes, reskinning is very easy!** The core game logic is completely theme-agnostic. You're mainly swapping:
- Images
- Colors
- Text
- Metadata

Everything else (game mechanics, IAP, settings, etc.) stays the same. You could create a new themed version in **30-60 minutes** once you have the assets ready!


