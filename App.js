import React, { useState } from 'react';
import Puzzle from './src/components/Puzzle';
import BoardSelection from './src/components/BoardSelection';
import { DIFFICULTY_LEVELS } from './src/utils/constants';

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS[0]); // Default to Easy
  const [selectedBoard, setSelectedBoard] = useState(null);

  if (selectedBoard) {
    return (
      <Puzzle
        difficulty={selectedDifficulty}
        boardImage={selectedBoard.image}
        boardId={selectedBoard.id}
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
