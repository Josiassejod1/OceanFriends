import React, { useState } from 'react';
import Puzzle from './src/components/Puzzle';
import BoardSelection from './src/components/BoardSelection';

export const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    label: 'Easy', 
    pieces: 4, 
    color: '#4CAF50',
  },
  { 
    id: 'medium', 
    label: 'Medium', 
    pieces: 9, 
    color: '#FF9800',
  },
  { 
    id: 'hard', 
    label: 'Hard', 
    pieces: 16, 
    color: '#F44336',
  },
];

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS[0]); // Default to Easy
  const [selectedBoard, setSelectedBoard] = useState(null);

  if (selectedBoard) {
    return (
      <Puzzle
        difficulty={selectedDifficulty}
        boardImage={selectedBoard.image}
        onBack={() => {
          setSelectedBoard(null);
        }}
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
