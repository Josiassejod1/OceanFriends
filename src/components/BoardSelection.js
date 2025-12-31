import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image as RNImage,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { DIFFICULTY_LEVELS } from '../../App';

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
];

const FREE_BOARDS_COUNT = 5;
const UNLOCK_KEY = '@unlocked_boards';

export default function BoardSelection({ difficulty, onSelectDifficulty, onSelectBoard }) {
  const [unlockedBoards, setUnlockedBoards] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnlockedBoards();
  }, []);

  const loadUnlockedBoards = async () => {
    try {
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
    if (isUnlocked(board.id)) {
      onSelectBoard(board);
    } else {
      handlePurchase(board);
    }
  };

  const handlePurchase = (board) => {
    Alert.alert(
      'Unlock Board',
      `Unlock "${board.name}" for $2.99?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            // TODO: Integrate with actual IAP (expo-in-app-purchases)
            // For now, just unlock it
            const newUnlocked = new Set(unlockedBoards);
            newUnlocked.add(board.id);
            setUnlockedBoards(newUnlocked);
            
            try {
              await storage.setItem(UNLOCK_KEY, JSON.stringify(Array.from(newUnlocked)));
              Alert.alert('Success', `${board.name} unlocked!`);
            } catch (error) {
              console.error('Error saving unlock:', error);
              Alert.alert('Error', 'Failed to unlock board. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleUnlockAll = () => {
    Alert.alert(
      'Unlock All Boards',
      'Unlock all remaining boards for $2.99?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            // TODO: Integrate with actual IAP
            const allIds = ALL_BOARDS.map(b => b.id);
            setUnlockedBoards(new Set(allIds));
            
            try {
              await storage.setItem(UNLOCK_KEY, JSON.stringify(allIds));
              Alert.alert('Success', 'All boards unlocked!');
            } catch (error) {
              console.error('Error saving unlock:', error);
              Alert.alert('Error', 'Failed to unlock boards. Please try again.');
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
    <SafeAreaView style={styles.container}>
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
        <View style={styles.difficultyPills}>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.difficultyPill,
                difficulty.id === level.id && styles.difficultyPillActive,
                { borderColor: level.color },
              ]}
              onPress={() => onSelectDifficulty(level)}
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
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.gridContainer}>
        {ALL_BOARDS.map((board, index) => {
          const unlocked = isUnlocked(board.id);
          const imageSource = RNImage.resolveAssetSource(board.image);
          const isEven = index % 2 === 0;
          
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
              </View>
              <Text style={styles.boardName} numberOfLines={1}>
                {board.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {lockedCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.unlockAllButton} onPress={handleUnlockAll}>
            <Text style={styles.unlockAllText}>
              Unlock All ({lockedCount} remaining) - $2.99
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 15,
  },
  difficultyPills: {
    flexDirection: 'row',
    gap: 10,
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
});

