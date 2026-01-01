import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image as RNImage,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { DIFFICULTY_LEVELS } from '../utils/constants';
import Settings from './Settings';
import { loadSounds, playClickSound, unloadSounds } from '../utils/audioUtils';
import {
  getBoardProgress,
  isPuzzleCompleted,
  getStatistics,
} from '../utils/progressUtils';

// Optional IAP imports - gracefully handle if package not installed
let iapUtils = null;
try {
  iapUtils = require('../utils/iapUtils');
} catch (e) {
  // IAP not available - app will work without it
  iapUtils = {
    initializeIAP: async () => false,
    disconnectIAP: async () => {},
    purchaseUnlockAll: async () => ({ success: false, error: 'IAP not available' }),
    restorePurchases: async () => ({ success: true, restored: 0 }),
    hasUnlockedAll: async () => false,
    getPurchaseInfo: async () => null,
  };
}

// Simple storage fallback if AsyncStorage is not available
let storage = null;
try {
  storage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback to in-memory storage
  const memoryStorage = {};
  storage = {
    getItem: async (key) => memoryStorage[key] || null,
    setItem: async (key, value) => { memoryStorage[key] = value; },
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 12;
// Calculate item size: (screen width - 2*padding - gap) / 2 items (2 columns)
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// All available boards
const ALL_BOARDS = [
  { id: 'clown', name: 'Clown Fish', image: require('../../assets/boards/clown.png') },
  { id: 'crab', name: 'Crab', image: require('../../assets/boards/crab.png') },
  { id: 'dolphin', name: 'Dolphin', image: require('../../assets/boards/dolphin.png') },
  { id: 'scuba', name: 'Scuba Diver', image: require('../../assets/boards/scuba.png') },
  { id: 'turtle', name: 'Turtle', image: require('../../assets/boards/turtle.png') },
  { id: 'treasure', name: 'Treasure', image: require('../../assets/boards/treasure.png') },
  { id: 'parasailing', name: 'Parasailing', image: require('../../assets/boards/parasailing.png') },
  { id: 'stingray', name: 'Stingray', image: require('../../assets/boards/stingray.png') },
  { id: 'shark', name: 'Shark', image: require('../../assets/boards/shark.png') },
  { id: 'octopus', name: 'Octopus', image: require('../../assets/boards/octopus.png') },
  { id: 'sealion', name: 'Sea Lion', image: require('../../assets/boards/sealion.png') },
  { id: 'sleep', name: 'Sleep', image: require('../../assets/boards/sleep.png') },
  { id: 'seahorse', name: 'Seahorse', image: require('../../assets/boards/seahorse.png') },
  { id: 'lobster', name: 'Lobster', image: require('../../assets/boards/lobster.png') },
  { id: 'jellyfish', name: 'Jellyfish', image: require('../../assets/boards/jellyfish.png') },
  { id: 'penguin', name: 'Penguin', image: require('../../assets/boards/penguin.png') },
  { id: 'star', name: 'Starfish', image: require('../../assets/boards/star.png') },
  { id: 'sword_fish', name: 'Swordfish', image: require('../../assets/boards/sword_fish.png') },
  { id: 'whale', name: 'Whale', image: require('../../assets/boards/whale.png') },
];

const FREE_BOARDS_COUNT = 5;
const UNLOCK_KEY = '@unlocked_boards';
const DIFFICULTY_LOCK_KEY = '@difficulty_locked';

export default function BoardSelection({ difficulty, onSelectDifficulty, onSelectBoard }) {
  const [unlockedBoards, setUnlockedBoards] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [difficultyLocked, setDifficultyLocked] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('$2.99'); // Default fallback
  const [boardProgress, setBoardProgress] = useState({}); // { boardId: { completed: 0, total: 3, percentage: 0 } }
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadUnlockedBoards();
    loadDifficultyLock();
    loadProgress();
    loadStatistics();
    initializeIAPAndLoadPrice();
    // Load sounds for board selection clicks
    loadSounds().catch(() => {
      // Silently fail - audio is optional
    });
    
    return () => {
      unloadSounds();
      iapUtils.disconnectIAP();
    };
  }, []);

  const loadProgress = async () => {
    const progress = {};
    for (const board of ALL_BOARDS) {
      progress[board.id] = await getBoardProgress(board.id);
    }
    setBoardProgress(progress);
  };

  const loadStatistics = async () => {
    const stats = await getStatistics();
    setStatistics(stats);
  };

  const initializeIAPAndLoadPrice = async () => {
    try {
      const ready = await iapUtils.initializeIAP();
      setIapReady(ready);
      
      if (ready) {
        // Try to restore previous purchases
        await iapUtils.restorePurchases();
        await loadUnlockedBoards(); // Reload after restoration
        
        // Get actual price from store
        const purchaseInfo = await iapUtils.getPurchaseInfo();
        if (purchaseInfo && purchaseInfo.price) {
          setPurchasePrice(purchaseInfo.price);
        }
      }
    } catch (error) {
      console.error('Error initializing IAP:', error);
      // Continue without IAP - app will still work
    }
  };

  useEffect(() => {
    if (!showSettings) {
      // Reload settings when settings modal closes
      loadDifficultyLock();
      // Reload progress when returning from settings
      loadProgress();
    }
  }, [showSettings]);

  const loadDifficultyLock = async () => {
    try {
      const locked = await storage.getItem(DIFFICULTY_LOCK_KEY);
      if (locked !== null) {
        setDifficultyLocked(JSON.parse(locked));
      }
    } catch (error) {
      console.error('Error loading difficulty lock:', error);
    }
  };

  const loadUnlockedBoards = async () => {
    try {
      // Check if "unlock all" was purchased
      const hasUnlocked = await iapUtils.hasUnlockedAll();
      
      if (hasUnlocked) {
        // If unlock all was purchased, unlock everything
        const allIds = ALL_BOARDS.map(b => b.id);
        setUnlockedBoards(new Set(allIds));
        await storage.setItem(UNLOCK_KEY, JSON.stringify(allIds));
      } else {
        // Otherwise, load from storage or use defaults
        const stored = await storage.getItem(UNLOCK_KEY);
        if (stored) {
          const unlocked = JSON.parse(stored);
          setUnlockedBoards(new Set(unlocked));
        } else {
          // First 5 are free by default
          const defaultUnlocked = ALL_BOARDS.slice(0, FREE_BOARDS_COUNT).map(b => b.id);
          setUnlockedBoards(new Set(defaultUnlocked));
          await storage.setItem(UNLOCK_KEY, JSON.stringify(defaultUnlocked));
        }
      }
    } catch (error) {
      console.error('Error loading unlocked boards:', error);
      // Default to first 5 free
      const defaultUnlocked = ALL_BOARDS.slice(0, FREE_BOARDS_COUNT).map(b => b.id);
      setUnlockedBoards(new Set(defaultUnlocked));
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (boardId) => {
    // First 5 are always free
    const index = ALL_BOARDS.findIndex(b => b.id === boardId);
    if (index < FREE_BOARDS_COUNT) return true;
    return unlockedBoards.has(boardId);
  };

  const handleBoardPress = (board) => {
    // Play subtle click sound when selecting a board
    playClickSound().catch(() => {
      // Silently fail if sound can't play
    });
    
    if (isUnlocked(board.id)) {
      onSelectBoard(board);
    } else {
      handlePurchase(board);
    }
  };

  const handlePurchase = (board) => {
    Alert.alert(
      'Unlock Board',
      `Unlock "${board.name}" for ${purchasePrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            // For individual boards, we'll unlock all (simpler IAP model)
            // In a production app, you might want individual board purchases
            if (iapReady) {
              const result = await iapUtils.purchaseUnlockAll();
              if (result.success) {
                await loadUnlockedBoards();
                Alert.alert('Success', `${board.name} unlocked!`);
              } else {
                Alert.alert('Purchase Failed', result.error || 'Please try again.');
              }
            } else {
              // Fallback if IAP not available (for testing)
              Alert.alert(
                'IAP Not Available',
                'In-app purchases are not available. Please use "Unlock All" option or try again later.'
              );
            }
          },
        },
      ]
    );
  };

  const handleUnlockAll = async () => {
    // Check if already purchased
    const alreadyUnlocked = await iapUtils.hasUnlockedAll();
    if (alreadyUnlocked) {
      await loadUnlockedBoards();
      Alert.alert('Already Unlocked', 'All boards are already unlocked!');
      return;
    }

    Alert.alert(
      'Unlock All Boards',
      `Unlock all remaining boards for ${purchasePrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            if (!iapReady) {
              Alert.alert(
                'IAP Not Available',
                'In-app purchases are not available on this device. Please try again later.'
              );
              return;
            }

            try {
              const result = await iapUtils.purchaseUnlockAll();
              
              if (result.success) {
                // Reload unlocked boards
                await loadUnlockedBoards();
                Alert.alert('Success', 'All boards unlocked!');
              } else {
                Alert.alert('Purchase Failed', result.error || 'Please try again.');
              }
            } catch (error) {
              console.error('Purchase error:', error);
              Alert.alert('Error', 'Failed to complete purchase. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lockedCount = ALL_BOARDS.length - FREE_BOARDS_COUNT - (unlockedBoards.size - FREE_BOARDS_COUNT);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {/* Base ocean gradient with wave effect */}
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB', '#90CAF9', '#BBDEFB', '#E3F2FD', '#BBDEFB', '#90CAF9']}
        locations={[0, 0.15, 0.3, 0.5, 0.65, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Puzzle</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>🛟</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.difficultyContainer}>
        <View style={styles.difficultyPills}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.difficultyPill,
                difficulty.id === level.id && styles.difficultyPillActive,
                { borderColor: level.color },
                difficultyLocked && difficulty.id !== level.id && styles.difficultyPillDisabled,
              ]}
              onPress={() => {
                if (!difficultyLocked || difficulty.id === level.id) {
                  onSelectDifficulty(level);
                }
              }}
              disabled={difficultyLocked && difficulty.id !== level.id}
            >
              <Text
                style={[
                  styles.difficultyPillText,
                  difficulty.id === level.id && { color: level.color },
                ]}
              >
                {level.label}
              </Text>
              <Text
                style={[
                  styles.difficultyPillSubtext,
                  difficulty.id === level.id && { color: level.color },
                ]}
              >
                {level.pieces} pieces
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {difficultyLocked && (
          <Text style={styles.lockedHint}>Difficulty locked</Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.gridContainer}>
        {ALL_BOARDS.map((board, index) => {
          const unlocked = isUnlocked(board.id);
          const imageSource = RNImage.resolveAssetSource(board.image);
          const isEven = index % 2 === 0;
          const progress = boardProgress[board.id] || { completed: 0, total: 3, percentage: 0 };
          const isCompleted = progress.completed === progress.total;
          
          return (
            <TouchableOpacity
              key={board.id}
              style={[styles.boardItem, !isEven && styles.boardItemRight]}
              onPress={() => handleBoardPress(board)}
              activeOpacity={0.7}
            >
              <View style={[styles.boardImageContainer, !unlocked && styles.lockedContainer]}>
                <Image
                  source={{ uri: imageSource?.uri }}
                  style={styles.boardImage}
                  contentFit="cover"
                />
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockText}>Locked</Text>
                  </View>
                )}
                {unlocked && progress.completed > 0 && (
                  <View style={styles.progressOverlay}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${progress.percentage}%` }
                        ]} 
                      />
                    </View>
                    {isCompleted && (
                      <Text style={styles.completedBadge}>✓</Text>
                    )}
                  </View>
                )}
              </View>
              <Text style={styles.boardName} numberOfLines={1}>
                {board.name}
              </Text>
              {unlocked && progress.completed > 0 && (
                <Text style={styles.progressText}>
                  {progress.completed}/{progress.total} completed
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {lockedCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.unlockAllButton} onPress={handleUnlockAll}>
            <Text style={styles.unlockAllText}>
              Unlock All ({lockedCount} remaining) - {purchasePrice}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Settings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  difficultyPills: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyPillDisabled: {
    opacity: 0.5,
  },
  lockedHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  difficultyPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillActive: {
    backgroundColor: '#F5F5F5',
  },
  difficultyPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#757575',
    marginBottom: 2,
  },
  difficultyPillSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  boardItem: {
    width: ITEM_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP + 8,
  },
  boardItemRight: {
    marginRight: 0,
  },
  boardImageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedContainer: {
    opacity: 0.6,
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  boardName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  unlockAllButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  unlockAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  completedBadge: {
    position: 'absolute',
    top: -25,
    right: 5,
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
});

