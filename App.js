import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Puzzle from './src/components/Puzzle';

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', pieces: 4, ageRange: 'Ages 3-5', color: '#4CAF50' },
  { id: 'medium', label: 'Medium', pieces: 9, ageRange: 'Ages 6-8', color: '#FF9800' },
  { id: 'hard', label: 'Hard', pieces: 16, ageRange: 'Ages 9-12', color: '#F44336' },
];

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  if (selectedDifficulty) {
    return (
      <Puzzle
        difficulty={selectedDifficulty}
        onBack={() => setSelectedDifficulty(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1e3c72', '#2a5298', '#4a90e2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>🌊 Ocean Friends Puzzle 🌊</Text>
          <Text style={styles.subtitle}>Choose your difficulty level!</Text>
          
          <View style={styles.difficultyContainer}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.difficultyButton, { borderColor: level.color }]}
                onPress={() => setSelectedDifficulty(level)}
                activeOpacity={0.7}
              >
                <Text style={[styles.difficultyLabel, { color: level.color }]}>
                  {level.label}
                </Text>
                <Text style={styles.difficultyPieces}>{level.pieces} Pieces</Text>
                <Text style={styles.difficultyAge}>{level.ageRange}</Text>
              </TouchableOpacity>
            ))}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.9,
  },
  difficultyContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  difficultyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  difficultyLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  difficultyPieces: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  difficultyAge: {
    fontSize: 16,
    color: '#999',
  },
});
