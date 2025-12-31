import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import PuzzlePiece from './PuzzlePiece';
import Confetti from './Confetti';
import { splitImageIntoPieces } from '../utils/puzzleUtils';
import { loadSounds, playCorrectSound, playSuccessSound, unloadSounds } from '../utils/audioUtils';
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
  markPuzzleCompleted,
  saveLastPlayed,
} from '../utils/progressUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PUZZLE_AREA_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.6);
const PIECE_SIZE = PUZZLE_AREA_SIZE / 4; // Base size for calculations

export default function Puzzle({ difficulty, boardImage, boardId, onBack }) {
  const [imageUri, setImageUri] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [solvedPieces, setSolvedPieces] = useState(0);
  const [placedPieces, setPlacedPieces] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const soundsReady = useRef(false);
  const saveStateTimeoutRef = useRef(null);

  useEffect(() => {
    loadImageAndState();
    // Load audio files on mount
    loadSounds().then(() => {
      soundsReady.current = true;
    }).catch(() => {
      // Silently fail - audio is optional
    });
    
    return () => {
      unloadSounds(); // Cleanup on unmount
      // Save state when component unmounts
      if (pieces.length > 0 && placedPieces.size > 0) {
        savePuzzleState(boardId, difficulty.id, pieces, placedPieces);
      }
      // Clear timeout if component unmounts
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, [boardImage, boardId]);

  const loadImageAndState = async () => {
    try {
      setLoading(true);
      
      if (!boardImage) {
        throw new Error('No board image provided');
      }
      
      // Get the URI from the require for local images using React Native's Image
      const imageSource = RNImage.resolveAssetSource(boardImage);
      const imageUri = imageSource?.uri;
      
      if (!imageUri) {
        throw new Error('Failed to resolve image source');
      }
      
      setImageUri(imageUri);
      
      // Try to load saved state
      const savedState = await loadPuzzleState();
      let puzzlePieces;
      
      if (savedState && savedState.boardId === boardId && savedState.difficultyId === difficulty.id) {
        // Restore from saved state
        puzzlePieces = splitImageIntoPieces(
          imageUri,
          difficulty.pieces,
          PUZZLE_AREA_SIZE
        );
        
        // Restore piece positions
        savedState.pieces.forEach(savedPiece => {
          const piece = puzzlePieces.find(p => p.id === savedPiece.id);
          if (piece) {
            piece.currentX = savedPiece.currentX;
            piece.currentY = savedPiece.currentY;
            piece.isPlaced = savedPiece.isPlaced;
          }
        });
        
        // Restore placed pieces set
        setPlacedPieces(new Set(savedState.placedPieceIds));
        setSolvedPieces(savedState.placedPieceIds.length);
      } else {
        // New puzzle - clear any old state
        await clearPuzzleState();
        puzzlePieces = splitImageIntoPieces(
          imageUri,
          difficulty.pieces,
          PUZZLE_AREA_SIZE
        );
        setPlacedPieces(new Set());
        setSolvedPieces(0);
      }
      
      setPieces(puzzlePieces);
      
      // Save last played
      await saveLastPlayed(boardId, difficulty.id);
    } catch (error) {
      console.error('Error loading image:', error);
      Alert.alert('Error', 'Failed to load image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecePlaced = useCallback((pieceId, isCorrect) => {
    setPlacedPieces((prev) => {
      const newSet = new Set(prev);
      if (isCorrect) {
        // Only add if not already placed
        if (!newSet.has(pieceId)) {
          newSet.add(pieceId);
          setSolvedPieces(newSet.size);
          
          // Play correct placement sound
          if (soundsReady.current) {
            playCorrectSound().catch(err => console.error('Sound play error:', err));
          }
          
          // Save state after piece placement (debounced)
          if (saveStateTimeoutRef.current) {
            clearTimeout(saveStateTimeoutRef.current);
          }
          saveStateTimeoutRef.current = setTimeout(() => {
            savePuzzleState(boardId, difficulty.id, pieces, newSet);
          }, 500); // Save 500ms after last placement
          
          // Check if puzzle is completed
          if (newSet.size === difficulty.pieces) {
            // Puzzle completed! Play success sound
            if (soundsReady.current) {
              playSuccessSound().catch(err => console.error('Sound play error:', err));
            }
            
            // Success haptic on completion
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
              // Silently fail if haptics not available
            });
            
            // Mark puzzle as completed
            markPuzzleCompleted(boardId, difficulty.id);
            
            // Clear saved state (puzzle is done)
            clearPuzzleState();
            
            // Puzzle completed!
            Animated.spring(fadeAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start(() => {
              setShowCelebration(true);
            });
          }
        }
      } else {
        // Remove if piece was moved away
        if (newSet.has(pieceId)) {
          newSet.delete(pieceId);
          setSolvedPieces(newSet.size);
          
          // Save state when piece is removed
          if (saveStateTimeoutRef.current) {
            clearTimeout(saveStateTimeoutRef.current);
          }
          saveStateTimeoutRef.current = setTimeout(() => {
            savePuzzleState(boardId, difficulty.id, pieces, newSet);
          }, 500);
        }
      }
      return newSet;
    });
  }, [difficulty.pieces, difficulty.id, boardId, pieces, fadeAnim]);

  const handleNewPuzzle = async () => {
    setSolvedPieces(0);
    setPlacedPieces(new Set());
    setShowCelebration(false);
    fadeAnim.setValue(1);
    await clearPuzzleState(); // Clear saved state for new puzzle
    loadImageAndState();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.background}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9B9B9B" />
            <Text style={styles.loadingText}>Loading ocean friend...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showCelebration) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.background}>
          <Confetti />
          <View style={styles.celebrationContainer}>
            <Text style={styles.celebrationEmoji}>🎉🌟🎉</Text>
            <Text style={styles.celebrationText}>Amazing!</Text>
            <Text style={styles.celebrationSubtext}>You completed the puzzle!</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleNewPuzzle}
              >
                <Text style={styles.buttonText}>New Puzzle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onBack}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Back to Menu
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>
            {solvedPieces} / {difficulty.pieces}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View style={[styles.puzzleContainer, { opacity: fadeAnim }]}>
          <View style={styles.puzzleWrapper}>
            <View style={styles.puzzleArea} collapsable={false}>
              {/* Wooden board background for puzzle area only */}
              <Image
                source={require('../../assets/boards/board.png')}
                style={styles.boardBackground}
                contentFit="cover"
              />
              {pieces.map((piece) => (
                <PuzzlePiece
                  key={piece.id}
                  piece={piece}
                  puzzleAreaSize={PUZZLE_AREA_SIZE}
                  gridSize={Math.sqrt(difficulty.pieces)}
                  onPlaced={handlePiecePlaced}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>Reference Image:</Text>
          <View style={styles.referenceImageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.referenceImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#F5F3F0', // Soft beige/cream
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B8B8B',
    fontSize: 18,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#6B6B6B',
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    color: '#6B6B6B',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  puzzleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  puzzleWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    padding: 30, // Allow space for piece overflow
  },
  puzzleArea: {
    width: PUZZLE_AREA_SIZE,
    height: PUZZLE_AREA_SIZE,
    borderRadius: 10,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  boardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  referenceContainer: {
    padding: 15,
    alignItems: 'center',
  },
  referenceLabel: {
    color: '#8B8B8B',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  referenceImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D5D5D5',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#6B6B6B',
    marginBottom: 10,
  },
  celebrationSubtext: {
    fontSize: 20,
    color: '#8B8B8B',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D5D5D5',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#C5C5C5',
  },
  buttonText: {
    color: '#6B6B6B',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#8B8B8B',
  },
});

