import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Animated } from 'react-native';
import PuzzlePiece from './PuzzlePiece';
import { splitImageIntoPieces } from '../utils/puzzleUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PUZZLE_AREA_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.6);
const PIECE_SIZE = PUZZLE_AREA_SIZE / 4; // Base size for calculations

export default function Puzzle({ difficulty, onBack }) {
  const [imageUri, setImageUri] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [solvedPieces, setSolvedPieces] = useState(0);
  const [placedPieces, setPlacedPieces] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadImage();
  }, []);

  const loadImage = async () => {
    try {
      setLoading(true);
      // Using thecatapi.com as requested
      const response = await fetch('https://api.thecatapi.com/v1/images/search?size=full');
      const data = await response.json();
      const imageUrl = data[0]?.url;
      
      if (imageUrl) {
        setImageUri(imageUrl);
        const puzzlePieces = splitImageIntoPieces(
          imageUrl,
          difficulty.pieces,
          PUZZLE_AREA_SIZE
        );
        setPieces(puzzlePieces);
      }
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
          
          // Check if puzzle is completed
          if (newSet.size === difficulty.pieces) {
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
        }
      }
      return newSet;
    });
  }, [difficulty.pieces, fadeAnim]);

  const handleNewPuzzle = () => {
    setSolvedPieces(0);
    setPlacedPieces(new Set());
    setShowCelebration(false);
    fadeAnim.setValue(1);
    loadImage();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading ocean friend...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (showCelebration) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#4CAF50', '#8BC34A']} style={styles.gradient}>
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
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e3c72', '#2a5298']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.progressText}>
            {solvedPieces} / {difficulty.pieces}
          </Text>
          <TouchableOpacity onPress={loadImage} style={styles.newButton}>
            <Text style={styles.newButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.puzzleContainer, { opacity: fadeAnim }]}>
          <View style={styles.puzzleWrapper}>
            <View style={styles.puzzleArea} collapsable={false}>
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
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newButton: {
    padding: 10,
  },
  newButtonText: {
    fontSize: 24,
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
  },
  puzzleArea: {
    width: PUZZLE_AREA_SIZE,
    height: PUZZLE_AREA_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    position: 'relative',
    overflow: 'visible',
  },
  referenceContainer: {
    padding: 15,
    alignItems: 'center',
  },
  referenceLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  referenceImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  celebrationSubtext: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 40,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  button: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#fff',
  },
});

