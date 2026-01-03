import React, { useState } from 'react';
import Puzzle from './src/components/Puzzle';
import BoardSelection, { ALL_BOARDS } from './src/components/BoardSelection';
import { DIFFICULTY_LEVELS } from './src/utils/constants';

// Import to check premium status
let iapUtils = null;
try {
  iapUtils = require('./src/utils/iapUtils');
} catch (e) {
  iapUtils = {
    hasUnlockedAll: async () => false,
  };
}

const FREE_BOARDS_COUNT = 5;

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS[0]); // Default to Easy
  const [selectedBoard, setSelectedBoard] = useState(null);

  // Function to select a random puzzle
  const selectRandomPuzzle = async () => {
    try {
      // Check if user has premium (unlocked all)
      const hasUnlocked = await iapUtils.hasUnlockedAll();
      
      // Get available boards - only first 5 if not premium
      const availableBoards = hasUnlocked ? ALL_BOARDS : ALL_BOARDS.slice(0, FREE_BOARDS_COUNT);
      
      if (availableBoards.length === 0) {
        // Fallback to first board if somehow no boards available
        setSelectedBoard(ALL_BOARDS[0]);
        return;
      }
      
      // Pick a random board from available ones
      const randomIndex = Math.floor(Math.random() * availableBoards.length);
      const randomBoard = availableBoards[randomIndex];
      
      setSelectedBoard(randomBoard);
    } catch (error) {
      console.error('Error selecting random puzzle:', error);
      // Fallback to first free board
      setSelectedBoard(ALL_BOARDS[0]);
    }
  };

  if (selectedBoard) {
    return (
      <Puzzle
        difficulty={selectedDifficulty}
        boardImage={selectedBoard.image}
        boardId={selectedBoard.id}
        onBack={() => {
          setSelectedBoard(null);
        }}
        onNewPuzzle={selectRandomPuzzle}
      />
    );
  }

  return (
    <BoardSelection
      difficulty={selectedDifficulty}
      onSelectDifficulty={setSelectedDifficulty}
      onSelectBoard={(board) => setSelectedBoard(board)}
    />
  );
}
