import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated as RNAnimated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { isPieceInCorrectPosition } from '../utils/puzzleUtils';

export default function PuzzlePiece({ piece, puzzleAreaSize, gridSize, onPlaced }) {
  const [isPlaced, setIsPlaced] = useState(piece.isPlaced);
  const [imageLoaded, setImageLoaded] = useState(false);
  const pan = useRef(new RNAnimated.ValueXY({ x: piece.currentX, y: piece.currentY })).current;
  const scale = useRef(new RNAnimated.Value(1)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const lastPositionRef = useRef({ x: piece.currentX, y: piece.currentY });
  const isDraggingRef = useRef(false);
  
  // Calculate boundaries with limited overflow (30% of piece size)
  const OVERFLOW_AMOUNT = piece.pieceSize * 0.3;
  const MIN_X = -OVERFLOW_AMOUNT;
  const MAX_X = puzzleAreaSize - piece.pieceSize + OVERFLOW_AMOUNT;
  const MIN_Y = -OVERFLOW_AMOUNT;
  const MAX_Y = puzzleAreaSize - piece.pieceSize + OVERFLOW_AMOUNT;

  const snapToPosition = (x, y) => {
    // Ensure coordinates are within bounds (0 to puzzleAreaSize)
    const boundedX = Math.max(0, Math.min(x, puzzleAreaSize - piece.pieceSize));
    const boundedY = Math.max(0, Math.min(y, puzzleAreaSize - piece.pieceSize));
    
    // Flatten offset first to get the actual current position
    pan.flattenOffset();
    
    // Now animate to the correct position
    RNAnimated.parallel([
      RNAnimated.spring(pan, {
        toValue: { x: boundedX, y: boundedY },
        useNativeDriver: false,
        damping: 15,
        stiffness: 150,
      }),
      RNAnimated.sequence([
        RNAnimated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: false,
        }),
        RNAnimated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  const checkPlacement = (x, y) => {
    const updatedPiece = {
      ...piece,
      currentX: x,
      currentY: y,
    };
    const isCorrect = isPieceInCorrectPosition(updatedPiece, 30); // Increased threshold for easier snapping
    
    if (isCorrect && !isPlaced) {
      // Medium haptic on correct placement
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Silently fail if haptics not available
      });
      
      // Snap to correct position
      setIsPlaced(true);
      onPlaced(piece.id, true);
      
      // Ensure correct position is within bounds
      const boundedX = Math.max(0, Math.min(piece.correctX, puzzleAreaSize - piece.pieceSize));
      const boundedY = Math.max(0, Math.min(piece.correctY, puzzleAreaSize - piece.pieceSize));
      
      // Update piece position first
      piece.currentX = boundedX;
      piece.currentY = boundedY;
      
      // Then animate to the correct position
      snapToPosition(boundedX, boundedY);
    } else if (!isCorrect && isPlaced) {
      setIsPlaced(false);
      onPlaced(piece.id, false);
      piece.currentX = x;
      piece.currentY = y;
    } else if (!isPlaced) {
      // Update piece position
      piece.currentX = x;
      piece.currentY = y;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isPlaced,
      onMoveShouldSetPanResponder: () => !isPlaced,
      onPanResponderGrant: () => {
        if (!isPlaced) {
          isDraggingRef.current = true;
          // Light haptic on piece pick up
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
            // Silently fail if haptics not available
          });
          
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
          pan.setValue({ x: 0, y: 0 });
          RNAnimated.spring(scale, {
            toValue: 1.1,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isPlaced) {
          // Get current offset position
          const offsetX = pan.x._offset || 0;
          const offsetY = pan.y._offset || 0;
          
          // Calculate new position with gesture
          const newX = offsetX + gestureState.dx;
          const newY = offsetY + gestureState.dy;
          
          // Constrain to boundaries
          const constrainedX = Math.max(MIN_X, Math.min(MAX_X, newX));
          const constrainedY = Math.max(MIN_Y, Math.min(MAX_Y, newY));
          
          // Set the constrained value
          pan.setValue({ 
            x: constrainedX - offsetX, 
            y: constrainedY - offsetY 
          });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isPlaced) {
          // Calculate the final position
          const offsetX = pan.x._offset || 0;
          const offsetY = pan.y._offset || 0;
          let finalX = offsetX + gestureState.dx;
          let finalY = offsetY + gestureState.dy;
          
          // Constrain to boundaries
          finalX = Math.max(MIN_X, Math.min(MAX_X, finalX));
          finalY = Math.max(MIN_Y, Math.min(MAX_Y, finalY));
          
          // Flatten offset first
          pan.flattenOffset();
          
          // Set the constrained position value
          pan.setValue({ x: finalX, y: finalY });
          
          // Update piece position
          piece.currentX = finalX;
          piece.currentY = finalY;
          lastPositionRef.current = { x: finalX, y: finalY };
          
          // Mark as no longer dragging
          isDraggingRef.current = false;
          
          RNAnimated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
          
          // Check placement and snap if close
          checkPlacement(finalX, finalY);
        } else {
          // If already placed, just reset scale
          RNAnimated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Calculate the full puzzle size for the image
  const fullPuzzleSize = piece.pieceSize * gridSize;
  
  const pieceImageStyle = {
    width: fullPuzzleSize,
    height: fullPuzzleSize,
    left: -piece.col * piece.pieceSize,
    top: -piece.row * piece.pieceSize,
  };

  // Sync animated position when piece position changes (e.g., from shuffle)
  useEffect(() => {
    if (!isPlaced && !isDraggingRef.current) {
      const dx = Math.abs(piece.currentX - lastPositionRef.current.x);
      const dy = Math.abs(piece.currentY - lastPositionRef.current.y);
      
      // Only update if position changed significantly (more than 10 pixels)
      // This prevents interference with normal dragging
      if (dx > 10 || dy > 10) {
        lastPositionRef.current = { x: piece.currentX, y: piece.currentY };
        // Flatten any existing offset
        pan.flattenOffset();
        // Update to new position with animation
        RNAnimated.spring(pan, {
          toValue: { x: piece.currentX, y: piece.currentY },
          useNativeDriver: false,
          damping: 15,
          stiffness: 150,
        }).start();
      }
    }
  }, [piece.currentX, piece.currentY, isPlaced]);

  // Handle image load with fade-in animation
  useEffect(() => {
    if (imageLoaded) {
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [imageLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <RNAnimated.View
      style={[
        styles.pieceContainer,
        {
          width: piece.pieceSize,
          height: piece.pieceSize,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
          zIndex: isPlaced ? 1 : 10,
        },
      ]}
      collapsable={false}
      {...panResponder.panHandlers}
    >
      <View style={[styles.pieceImageContainer, { overflow: 'hidden' }]}>
        {/* Placeholder background to prevent flash */}
        {!imageLoaded && (
          <View style={[pieceImageStyle, styles.imagePlaceholder]} />
        )}
        <RNAnimated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: opacity },
          ]}
        >
          <Image
            source={{ uri: piece.imageUri }}
            style={pieceImageStyle}
            contentFit="cover"
            onLoad={handleImageLoad}
            transition={200}
          />
        </RNAnimated.View>
      </View>
      {isPlaced && (
        <View style={styles.placedIndicator}>
          <View style={styles.checkmark} />
        </View>
      )}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  pieceContainer: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D5D5D5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pieceImageContainer: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E5E5E5',
    position: 'absolute',
  },
  placedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkmark: {
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
});
