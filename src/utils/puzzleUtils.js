export function splitImageIntoPieces(imageUri, pieceCount, puzzleSize) {
  const gridSize = Math.sqrt(pieceCount);
  const pieceSize = puzzleSize / gridSize;
  const pieces = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const pieceId = row * gridSize + col;
      const correctX = col * pieceSize;
      const correctY = row * pieceSize;

      // Random starting position (scattered around, but ensure they're visible)
      // Position pieces outside the puzzle area but nearby
      const offsetX = puzzleSize * 0.3;
      const offsetY = puzzleSize * 0.3;
      const startX = (Math.random() - 0.5) * puzzleSize * 1.2 + puzzleSize / 2;
      const startY = (Math.random() - 0.5) * puzzleSize * 1.2 + puzzleSize / 2;

      pieces.push({
        id: pieceId,
        imageUri,
        correctX,
        correctY,
        currentX: startX,
        currentY: startY,
        row,
        col,
        pieceSize,
        gridSize,
        isPlaced: false,
      });
    }
  }

  return pieces;
}

export function isPieceInCorrectPosition(piece, threshold = 30) {
  const dx = Math.abs(piece.currentX - piece.correctX);
  const dy = Math.abs(piece.currentY - piece.correctY);
  return dx < threshold && dy < threshold;
}

