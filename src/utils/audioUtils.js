import { Audio } from 'expo-av';

let correctSound = null;
let successSound = null;
let soundsLoaded = false;

export async function loadSounds() {
  try {
    // Set audio mode for better performance
    // Using minimal config to avoid errors
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Load correct placement sound
    const { sound: correct } = await Audio.Sound.createAsync(
      require('../../assets/audio/correct.mp3'),
      { shouldPlay: false, volume: 1.0 }
    );
    correctSound = correct;

    // Load success/completion sound
    const { sound: success } = await Audio.Sound.createAsync(
      require('../../assets/audio/success.mp3'),
      { shouldPlay: false, volume: 1.0 }
    );
    successSound = success;

    soundsLoaded = true;
  } catch (error) {
    soundsLoaded = false;
  }
}

export async function playCorrectSound() {
  if (!soundsLoaded || !correctSound) {
    return;
  }
  
  try {
    // Get current status
    const status = await correctSound.getStatusAsync();
    
    // If already playing, stop it first
    if (status.isLoaded && status.isPlaying) {
      await correctSound.stopAsync();
    }
    
    // Reset to beginning and play
    await correctSound.setPositionAsync(0);
    await correctSound.playAsync();
  } catch (error) {
    // Silently fail - audio is optional
  }
}

export async function playSuccessSound() {
  if (!soundsLoaded || !successSound) {
    return;
  }
  
  try {
    // Get current status
    const status = await successSound.getStatusAsync();
    
    // If already playing, stop it first
    if (status.isLoaded && status.isPlaying) {
      await successSound.stopAsync();
    }
    
    // Reset to beginning and play
    await successSound.setPositionAsync(0);
    await successSound.playAsync();
  } catch (error) {
    // Silently fail - audio is optional
  }
}

export async function unloadSounds() {
  try {
    if (correctSound) {
      await correctSound.unloadAsync();
      correctSound = null;
    }
    if (successSound) {
      await successSound.unloadAsync();
      successSound = null;
    }
    soundsLoaded = false;
  } catch (error) {
    // Silently fail during cleanup
  }
}

