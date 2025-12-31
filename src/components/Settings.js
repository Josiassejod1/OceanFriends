import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { showReviewPrompt } from '../utils/reviewUtils';

// Get version from app.json (fallback if expo-constants not available)
let appVersion = '1.0.0';
try {
  const Constants = require('expo-constants').default;
  appVersion = Constants.expoConfig?.version || '1.0.0';
} catch (e) {
  // Fallback: try to read from app.json directly
  try {
    const appJson = require('../../app.json');
    appVersion = appJson.expo?.version || '1.0.0';
  } catch (e2) {
    // Final fallback
    appVersion = '1.0.0';
  }
}

// Simple storage fallback
let storage = null;
try {
  storage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  const memoryStorage = {};
  storage = {
    getItem: async (key) => memoryStorage[key] || null,
    setItem: async (key, value) => { memoryStorage[key] = value; },
  };
}

const SETTINGS_KEYS = {
  SOUND_ENABLED: '@sound_enabled',
  DIFFICULTY_LOCKED: '@difficulty_locked',
  PARENTAL_PASSWORD: '@parental_password',
};

export default function Settings({ visible, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficultyLocked, setDifficultyLocked] = useState(false);
  const [showParentalChallenge, setShowParentalChallenge] = useState(false);
  const [challengeNums, setChallengeNums] = useState([0, 0]);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const sound = await storage.getItem(SETTINGS_KEYS.SOUND_ENABLED);
      const locked = await storage.getItem(SETTINGS_KEYS.DIFFICULTY_LOCKED);
      
      if (sound !== null) {
        setSoundEnabled(JSON.parse(sound));
      }
      if (locked !== null) {
        setDifficultyLocked(JSON.parse(locked));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleSoundToggle = (value) => {
    setSoundEnabled(value);
    saveSetting(SETTINGS_KEYS.SOUND_ENABLED, value);
  };

  const handleDifficultyLockToggle = (value) => {
    if (value) {
      // Need parental challenge to enable lock
      setPendingAction(() => () => {
        setDifficultyLocked(true);
        saveSetting(SETTINGS_KEYS.DIFFICULTY_LOCKED, true);
      });
      showChallenge();
    } else {
      // Need parental challenge to disable lock
      setPendingAction(() => () => {
        setDifficultyLocked(false);
        saveSetting(SETTINGS_KEYS.DIFFICULTY_LOCKED, false);
      });
      showChallenge();
    }
  };

  const showChallenge = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setChallengeNums([num1, num2]);
    setChallengeAnswer('');
    setShowParentalChallenge(true);
  };

  const handleChallengeSubmit = () => {
    const correctAnswer = challengeNums[0] + challengeNums[1];
    const userAnswer = parseInt(challengeAnswer.trim(), 10);

    if (userAnswer === correctAnswer) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setShowParentalChallenge(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        Alert.alert('Success', 'Setting updated');
      }, 500);
    } else {
      Alert.alert('Incorrect', 'Please try again');
      setChallengeAnswer('');
    }
  };

  const handleChallengeCancel = () => {
    setShowParentalChallenge(false);
    setChallengeAnswer('');
    setPendingAction(null);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will unlock all boards. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setPendingAction(() => async () => {
              try {
                await storage.removeItem('@unlocked_boards');
                Alert.alert('Success', 'Progress reset');
              } catch (error) {
                Alert.alert('Error', 'Failed to reset progress');
              }
            });
            showChallenge();
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={['#E3F2FD', '#BBDEFB', '#90CAF9', '#BBDEFB']}
          locations={[0, 0.33, 0.66, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Audio Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Parental Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parental Controls</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lock Difficulty</Text>
                <Text style={styles.settingDescription}>
                  Prevent changing difficulty level
                </Text>
              </View>
              <Switch
                value={difficultyLocked}
                onValueChange={handleDifficultyLockToggle}
                trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Other Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetProgress}
            >
              <Text style={styles.resetButtonText}>Reset Progress</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>Ocean Friends Jigsaw</Text>
            <Text style={styles.aboutText}>
              Version {appVersion}
            </Text>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={showReviewPrompt}
            >
              <Text style={styles.reviewButtonText}>⭐ Rate This App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Parental Challenge Modal */}
        <Modal
          visible={showParentalChallenge}
          transparent
          animationType="fade"
          onRequestClose={handleChallengeCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.challengeModal}>
              {isVerifying ? (
                <ActivityIndicator size="large" color="#4A90E2" />
              ) : (
                <>
                  <Text style={styles.challengeTitle}>
                    Parental Verification
                  </Text>
                  <Text style={styles.challengeQuestion}>
                    What is {challengeNums[0]} + {challengeNums[1]}?
                  </Text>
                  <TextInput
                    style={styles.challengeInput}
                    keyboardType="numeric"
                    value={challengeAnswer}
                    onChangeText={setChallengeAnswer}
                    placeholder="Enter answer"
                    placeholderTextColor="#999"
                    editable={!isVerifying}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.challengeButton, styles.submitButton]}
                    onPress={handleChallengeSubmit}
                    disabled={isVerifying || !challengeAnswer.trim()}
                  >
                    <Text style={styles.challengeButtonText}>Submit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.challengeButton, styles.cancelButton]}
                    onPress={handleChallengeCancel}
                    disabled={isVerifying}
                  >
                    <Text style={[styles.challengeButtonText, styles.cancelButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#424242',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#424242',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  aboutText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  reviewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeModal: {
    width: '80%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 10,
    textAlign: 'center',
  },
  challengeQuestion: {
    fontSize: 18,
    color: '#424242',
    marginBottom: 20,
    textAlign: 'center',
  },
  challengeInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: '#F5F5F5',
  },
  challengeButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#424242',
  },
});

