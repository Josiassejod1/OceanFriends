import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D'];
const CONFETTI_COUNT = 50;

export default function Confetti() {
  const confettiPieces = useRef(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 8,
      duration: Math.random() * 2000 + 2000,
    }))
  ).current;

  useEffect(() => {
    const animations = confettiPieces.map((piece) => {
      return Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration: piece.duration,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: Math.random() * 720 - 360,
          duration: piece.duration,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confetti,
            {
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
});

