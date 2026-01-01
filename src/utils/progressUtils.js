import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  COMPLETED_PUZZLES: '@completed_puzzles',
  PUZZLE_STATE: '@puzzle_state',
  STATISTICS: '@puzzle_statistics',
  LAST_PLAYED: '@last_played',
};

/**
 * Save current puzzle state (for resuming)
 */
export async function savePuzzleState(boardId, difficultyId, pieces, placedPieces) {
  try {
    const state = {
      boardId,
      difficultyId,
      pieces: pieces.map(p => ({
        id: p.id,
        currentX: p.currentX,
        currentY: p.currentY,
        isPlaced: p.isPlaced,
      })),
      placedPieceIds: Array.from(placedPieces),
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.PUZZLE_STATE, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving puzzle state:', error);
    return false;
  }
}

/**
 * Load saved puzzle state
 */
export async function loadPuzzleState() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PUZZLE_STATE);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error loading puzzle state:', error);
    return null;
  }
}

/**
 * Clear saved puzzle state (when puzzle is completed or reset)
 */
export async function clearPuzzleState() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PUZZLE_STATE);
    return true;
  } catch (error) {
    console.error('Error clearing puzzle state:', error);
    return false;
  }
}

/**
 * Mark puzzle as completed
 */
export async function markPuzzleCompleted(boardId, difficultyId) {
  try {
    const completed = await getCompletedPuzzles();
    const key = `${boardId}_${difficultyId}`;
    
    if (!completed.includes(key)) {
      completed.push(key);
      await AsyncStorage.setItem(
        STORAGE_KEYS.COMPLETED_PUZZLES,
        JSON.stringify(completed)
      );
      
      // Update statistics
      await updateStatistics(boardId, difficultyId);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking puzzle completed:', error);
    return false;
  }
}

/**
 * Get all completed puzzles
 */
export async function getCompletedPuzzles() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_PUZZLES);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error getting completed puzzles:', error);
    return [];
  }
}

/**
 * Check if a puzzle is completed
 */
export async function isPuzzleCompleted(boardId, difficultyId) {
  try {
    const completed = await getCompletedPuzzles();
    const key = `${boardId}_${difficultyId}`;
    return completed.includes(key);
  } catch (error) {
    console.error('Error checking puzzle completion:', error);
    return false;
  }
}

/**
 * Get completion count for a board across all difficulties
 */
export async function getBoardCompletionCount(boardId) {
  try {
    const completed = await getCompletedPuzzles();
    const difficulties = ['easy', 'medium', 'hard'];
    let count = 0;
    
    for (const diff of difficulties) {
      const key = `${boardId}_${diff}`;
      if (completed.includes(key)) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Error getting board completion count:', error);
    return 0;
  }
}

/**
 * Update statistics
 */
async function updateStatistics(boardId, difficultyId) {
  try {
    const stats = await getStatistics();
    
    // Increment total puzzles completed
    stats.totalCompleted = (stats.totalCompleted || 0) + 1;
    
    // Track by difficulty
    if (!stats.byDifficulty) {
      stats.byDifficulty = {};
    }
    stats.byDifficulty[difficultyId] = (stats.byDifficulty[difficultyId] || 0) + 1;
    
    // Track by board
    if (!stats.byBoard) {
      stats.byBoard = {};
    }
    stats.byBoard[boardId] = (stats.byBoard[boardId] || 0) + 1;
    
    // Update last completed
    stats.lastCompleted = {
      boardId,
      difficultyId,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating statistics:', error);
  }
}

/**
 * Get statistics
 */
export async function getStatistics() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.STATISTICS);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      totalCompleted: 0,
      byDifficulty: {},
      byBoard: {},
      lastCompleted: null,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return {
      totalCompleted: 0,
      byDifficulty: {},
      byBoard: {},
      lastCompleted: null,
    };
  }
}

/**
 * Save last played puzzle info
 */
export async function saveLastPlayed(boardId, difficultyId) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_PLAYED,
      JSON.stringify({ boardId, difficultyId, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Error saving last played:', error);
  }
}

/**
 * Get last played puzzle
 */
export async function getLastPlayed() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error getting last played:', error);
    return null;
  }
}

/**
 * Clear last played puzzle session
 */
export async function clearLastPlayed() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_PLAYED);
    return true;
  } catch (error) {
    console.error('Error clearing last played:', error);
    return false;
  }
}

/**
 * Reset all progress
 */
export async function resetAllProgress() {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.COMPLETED_PUZZLES,
      STORAGE_KEYS.PUZZLE_STATE,
      STORAGE_KEYS.STATISTICS,
      STORAGE_KEYS.LAST_PLAYED,
    ]);
    return true;
  } catch (error) {
    console.error('Error resetting progress:', error);
    return false;
  }
}

/**
 * Get progress percentage for a board
 */
export async function getBoardProgress(boardId) {
  try {
    const completed = await getCompletedPuzzles();
    const difficulties = ['easy', 'medium', 'hard'];
    let completedCount = 0;
    
    for (const diff of difficulties) {
      const key = `${boardId}_${diff}`;
      if (completed.includes(key)) {
        completedCount++;
      }
    }
    
    return {
      completed: completedCount,
      total: difficulties.length,
      percentage: Math.round((completedCount / difficulties.length) * 100),
    };
  } catch (error) {
    console.error('Error getting board progress:', error);
    return { completed: 0, total: 3, percentage: 0 };
  }
}


