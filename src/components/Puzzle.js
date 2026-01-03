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
  Modal,
  StatusBar,
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
  clearLastPlayed,
  isPuzzleCompleted,
} from '../utils/progressUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PUZZLE_AREA_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.6);
const PIECE_SIZE = PUZZLE_AREA_SIZE / 4; // Base size for calculations

export default function Puzzle({ difficulty, boardImage, boardId, onBack, onNewPuzzle }) {
  const [imageUri, setImageUri] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [solvedPieces, setSolvedPieces] = useState(0);
  const [placedPieces, setPlacedPieces] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hintGlowAnim = useRef(new Animated.Value(0)).current;
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

  // Animate hint glow when hint is shown
  useEffect(() => {
    if (showHint) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(hintGlowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(hintGlowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    } else {
      hintGlowAnim.setValue(0);
    }
  }, [showHint]);

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
      
      // Check if puzzle is already completed - if so, start fresh
      const completed = await isPuzzleCompleted(boardId, difficulty.id);
      
      // Try to load saved state (only if not completed)
      const savedState = !completed ? await loadPuzzleState() : null;
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
        // New puzzle or completed puzzle - clear any old state
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
            
            // Clear saved state and session (puzzle is done) - fire and forget
            clearPuzzleState().catch(err => console.error('Error clearing puzzle state:', err));
            clearLastPlayed().catch(err => console.error('Error clearing last played:', err));
            
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
    
    // If onNewPuzzle callback is provided, use it to select a random puzzle
    // Otherwise, just reload the current puzzle
    if (onNewPuzzle) {
      onNewPuzzle();
    } else {
      loadImageAndState();
    }
  };

  const handleShuffle = useCallback(() => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // Reset only unplaced pieces to random positions
    setPieces((prevPieces) => {
      const updatedPieces = prevPieces.map((piece) => {
        // Only shuffle pieces that aren't placed
        if (!placedPieces.has(piece.id)) {
          // Random starting position (constrained to visible area)
          const padding = 30; // Match puzzleWrapper padding
          const minX = -padding;
          const maxX = PUZZLE_AREA_SIZE - piece.pieceSize + padding;
          const minY = -padding;
          const maxY = PUZZLE_AREA_SIZE - piece.pieceSize + padding;
          
          const startX = Math.random() * (maxX - minX) + minX;
          const startY = Math.random() * (maxY - minY) + minY;
          
          return {
            ...piece,
            currentX: startX,
            currentY: startY,
            isPlaced: false,
          };
        }
        // Keep placed pieces as they are
        return piece;
      });
      
      // Save state after shuffling
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
      saveStateTimeoutRef.current = setTimeout(() => {
        savePuzzleState(boardId, difficulty.id, updatedPieces, placedPieces);
      }, 500);
      
      return updatedPieces;
    });
  }, [placedPieces, boardId, difficulty.id]);

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
          <TouchableOpacity
            onPress={handleShuffle}
            style={styles.shuffleButton}
          >
            <Text style={styles.shuffleButtonText}>🔀 Shuffle</Text>
          </TouchableOpacity>
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
              {/* Hint glow indicators for unplaced pieces */}
              {showHint && pieces.map((piece) => {
                if (!placedPieces.has(piece.id)) {
                  return (
                    <Animated.View
                      key={`hint-${piece.id}`}
                      style={[
                        styles.hintGlow,
                        {
                          left: piece.correctX,
                          top: piece.correctY,
                          width: piece.pieceSize,
                          height: piece.pieceSize,
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.hintGlowInner,
                          {
                            opacity: hintGlowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.4, 0.9],
                            }),
                            transform: [
                              {
                                scale: hintGlowAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.95, 1.05],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    </Animated.View>
                  );
                }
                return null;
              })}
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
          <View style={styles.referenceHeader}>
            <Text style={styles.referenceLabel}>Reference Image:</Text>
            <TouchableOpacity
              style={styles.hintButton}
              onPress={() => {
                setShowHint(!showHint);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
            >
              <Text style={styles.hintButtonText}>💡 Hint</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.referenceContent}>
            <TouchableOpacity
              style={styles.referenceImageContainer}
              onPress={() => {
                setShowFullScreenImage(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.referenceImage}
                contentFit="cover"
              />
            </TouchableOpacity>
            {showHint && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  💡 Tap and drag pieces to move them. They'll snap into place when close to the correct position!
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <StatusBar hidden={true} />
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Text style={styles.fullScreenCloseText}>✕ Close</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullScreenImage}
            contentFit="contain"
          />
        </View>
      </Modal>
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
  shuffleButton: {
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  shuffleButtonText: {
    color: '#6B6B6B',
    fontSize: 14,
    fontWeight: '600',
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
    paddingBottom: 20,
  },
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  referenceLabel: {
    color: '#8B8B8B',
    fontSize: 16,
    fontWeight: '500',
  },
  hintButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D5D5D5',
  },
  hintButtonText: {
    color: '#6B6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  referenceContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  referenceImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D5D5D5',
    flexShrink: 0,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  hintContainer: {
    flex: 1,
    marginLeft: 15,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
    alignSelf: 'stretch',
  },
  hintText: {
    color: '#8B6914',
    fontSize: 13,
    lineHeight: 18,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fullScreenCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  hintGlow: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 5,
  },
  hintGlowInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
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

