import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated as RNAnimated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { isPieceInCorrectPosition } from '../utils/puzzleUtils';

export default function PuzzlePiece({ piece, puzzleAreaSize, gridSize, onPlaced }) {
  const [isPlaced, setIsPlaced] = useState(piece.isPlaced);
  const pan = useRef(new RNAnimated.ValueXY({ x: piece.currentX, y: piece.currentY })).current;
  const scale = useRef(new RNAnimated.Value(1)).current;

  const snapToPosition = (x, y) => {
    RNAnimated.parallel([
      RNAnimated.spring(pan, {
        toValue: { x, y },
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
    const isCorrect = isPieceInCorrectPosition(updatedPiece);
    
    if (isCorrect && !isPlaced) {
      setIsPlaced(true);
      onPlaced(piece.id, true);
      snapToPosition(piece.correctX, piece.correctY);
    } else if (!isCorrect && isPlaced) {
      setIsPlaced(false);
      onPlaced(piece.id, false);
    } else {
      // Update position even if not placed correctly
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
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isPlaced) {
          const offsetX = pan.x._offset || 0;
          const offsetY = pan.y._offset || 0;
          const newX = offsetX + gestureState.dx;
          const newY = offsetY + gestureState.dy;
          
          pan.flattenOffset();
          pan.setValue({ x: newX, y: newY });
          
          RNAnimated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
          
          // Update piece position and check placement
          piece.currentX = newX;
          piece.currentY = newY;
          checkPlacement(newX, newY);
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
        <Image
          source={{ uri: piece.imageUri }}
          style={pieceImageStyle}
          contentFit="cover"
        />
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
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pieceImageContainer: {
    width: '100%',
    height: '100%',
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
