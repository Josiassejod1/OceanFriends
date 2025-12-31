import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Puzzle from './src/components/Puzzle';

const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    label: 'Easy', 
    pieces: 4, 
    ageRange: 'Ages 3-5', 
    color: '#4CAF50', 
    emoji: '🐠', 
    icon: '🧩',
    gradient: ['#E8F5E9', '#F1F8E9'],
    description: 'Perfect for little ones!',
    bgColor: '#E8F5E9'
  },
  { 
    id: 'medium', 
    label: 'Medium', 
    pieces: 9, 
    ageRange: 'Ages 6-8', 
    color: '#FF9800', 
    emoji: '🐢', 
    icon: '🧩',
    gradient: ['#FFF3E0', '#FFF8E1'],
    description: 'A fun challenge!',
    bgColor: '#FFF3E0'
  },
  { 
    id: 'hard', 
    label: 'Hard', 
    pieces: 16, 
    ageRange: 'Ages 9-12', 
    color: '#F44336', 
    emoji: '🐬', 
    icon: '🧩',
    gradient: ['#FFEBEE', '#FCE4EC'],
    description: 'For puzzle masters!',
    bgColor: '#FFEBEE'
  },
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
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🌊</Text>
            </View>
            <Text style={styles.greeting}>Let's Play!</Text>
          </View>

          <View style={styles.activitiesContainer}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelectedDifficulty(level)}
                activeOpacity={0.7}
                style={styles.activityCard}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: level.bgColor }]}>
                  <Text style={styles.cardIcon}>{level.icon}</Text>
                  <Text style={styles.cardEmoji}>{level.emoji}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: level.color }]}>
                    {level.label}
                  </Text>
                  <Text style={styles.cardDescription}>{level.description}</Text>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardPieces}>{level.pieces} pieces</Text>
                    <Text style={styles.cardAge}>• {level.ageRange}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#BBDEFB',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#424242',
  },
  activitiesContainer: {
    flex: 1,
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexDirection: 'row',
    gap: 4,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPieces: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  cardAge: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
});
