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
      // Constrain to visible area: account for wrapper padding (30px) and piece size
      const padding = 30; // Match puzzleWrapper padding
      const minX = -padding;
      const maxX = puzzleSize - pieceSize + padding;
      const minY = -padding;
      const maxY = puzzleSize - pieceSize + padding;
      
      // Generate random position within constrained bounds
      const startX = Math.random() * (maxX - minX) + minX;
      const startY = Math.random() * (maxY - minY) + minY;

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

/**
 * Generates a single jigsaw side using Bezier curves (based on Stack Overflow solution)
 * @param {number} s - Side length
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {boolean} isOutward - True for tab (outward), false for blank (inward)
 * @param {string} direction - 'top', 'right', 'bottom', 'left'
 * @returns {string} SVG path commands for the side
 */
function generateJigsawSide(s, cx, cy, isOutward, direction) {
  const tabSize = s * 0.3;
  const tabDepth = s * 0.15;
  const path = [];
  
  if (isOutward) {
    // Outward tab (protrusion)
    if (direction === 'top' || direction === 'bottom') {
      const y = direction === 'top' ? cy - tabDepth : cy + tabDepth;
      const startY = direction === 'top' ? cy : cy;
      const endY = direction === 'top' ? cy : cy;
      
      path.push(`L ${cx + s * 0.34} ${startY}`);
      path.push(`C ${cx + s * 0.5} ${startY}, ${cx + s * 0.4} ${y}, ${cx + s * 0.4} ${y}`);
      path.push(`C ${cx + s * 0.3} ${y + (direction === 'top' ? -s * 0.15 : s * 0.15)}, ${cx + s * 0.5} ${y + (direction === 'top' ? -s * 0.15 : s * 0.15)}, ${cx + s * 0.5} ${y + (direction === 'top' ? -s * 0.15 : s * 0.15)}`);
      path.push(`C ${cx + s * 0.7} ${y + (direction === 'top' ? -s * 0.15 : s * 0.15)}, ${cx + s * 0.6} ${y}, ${cx + s * 0.6} ${y}`);
      path.push(`C ${cx + s * 0.5} ${endY}, ${cx + s * 0.65} ${endY}, ${cx + s * 0.65} ${endY}`);
      path.push(`L ${cx + s} ${endY}`);
    } else {
      // Left or right
      const x = direction === 'left' ? cx - tabDepth : cx + tabDepth;
      const startX = direction === 'left' ? cx : cx;
      const endX = direction === 'left' ? cx : cx;
      
      path.push(`L ${startX} ${cy + s * 0.34}`);
      path.push(`C ${startX} ${cy + s * 0.5}, ${x} ${cy + s * 0.4}, ${x} ${cy + s * 0.4}`);
      path.push(`C ${x + (direction === 'left' ? -s * 0.15 : s * 0.15)} ${cy + s * 0.3}, ${x + (direction === 'left' ? -s * 0.15 : s * 0.15)} ${cy + s * 0.5}, ${x + (direction === 'left' ? -s * 0.15 : s * 0.15)} ${cy + s * 0.5}`);
      path.push(`C ${x + (direction === 'left' ? -s * 0.15 : s * 0.15)} ${cy + s * 0.7}, ${x} ${cy + s * 0.6}, ${x} ${cy + s * 0.6}`);
      path.push(`C ${endX} ${cy + s * 0.5}, ${endX} ${cy + s * 0.65}, ${endX} ${cy + s * 0.65}`);
      path.push(`L ${endX} ${cy + s}`);
    }
  } else {
    // Inward blank (indentation) - mirror of outward
    if (direction === 'top' || direction === 'bottom') {
      const y = direction === 'top' ? cy + tabDepth : cy - tabDepth;
      const startY = direction === 'top' ? cy : cy;
      const endY = direction === 'top' ? cy : cy;
      
      path.push(`L ${cx + s * 0.34} ${startY}`);
      path.push(`C ${cx + s * 0.5} ${startY}, ${cx + s * 0.4} ${y}, ${cx + s * 0.4} ${y}`);
      path.push(`C ${cx + s * 0.3} ${y + (direction === 'top' ? s * 0.15 : -s * 0.15)}, ${cx + s * 0.5} ${y + (direction === 'top' ? s * 0.15 : -s * 0.15)}, ${cx + s * 0.5} ${y + (direction === 'top' ? s * 0.15 : -s * 0.15)}`);
      path.push(`C ${cx + s * 0.7} ${y + (direction === 'top' ? s * 0.15 : -s * 0.15)}, ${cx + s * 0.6} ${y}, ${cx + s * 0.6} ${y}`);
      path.push(`C ${cx + s * 0.5} ${endY}, ${cx + s * 0.65} ${endY}, ${cx + s * 0.65} ${endY}`);
      path.push(`L ${cx + s} ${endY}`);
    } else {
      // Left or right
      const x = direction === 'left' ? cx + tabDepth : cx - tabDepth;
      const startX = direction === 'left' ? cx : cx;
      const endX = direction === 'left' ? cx : cx;
      
      path.push(`L ${startX} ${cy + s * 0.34}`);
      path.push(`C ${startX} ${cy + s * 0.5}, ${x} ${cy + s * 0.4}, ${x} ${cy + s * 0.4}`);
      path.push(`C ${x + (direction === 'left' ? s * 0.15 : -s * 0.15)} ${cy + s * 0.3}, ${x + (direction === 'left' ? s * 0.15 : -s * 0.15)} ${cy + s * 0.5}, ${x + (direction === 'left' ? s * 0.15 : -s * 0.15)} ${cy + s * 0.5}`);
      path.push(`C ${x + (direction === 'left' ? s * 0.15 : -s * 0.15)} ${cy + s * 0.7}, ${x} ${cy + s * 0.6}, ${x} ${cy + s * 0.6}`);
      path.push(`C ${endX} ${cy + s * 0.5}, ${endX} ${cy + s * 0.65}, ${endX} ${cy + s * 0.65}`);
      path.push(`L ${endX} ${cy + s}`);
    }
  }
  
  return path.join(' ');
}

/**
 * Generates an SVG path for a jigsaw puzzle piece with tabs and blanks
 * Uses improved Bezier curves based on Stack Overflow solution
 * @param {number} row - Row index of the piece (0-based)
 * @param {number} col - Column index of the piece (0-based)
 * @param {number} gridSize - Total grid size (e.g., 2 for 4 pieces, 3 for 9 pieces)
 * @param {number} pieceSize - Size of the piece in pixels
 * @returns {string} SVG path string
 */
export function generatePiecePath(row, col, gridSize, pieceSize) {
  const edgePadding = pieceSize * 0.05; // Small padding from edges
  
  // Determine which edges have tabs (outward) or blanks (inward)
  // Pattern ensures adjacent pieces have matching tabs and blanks
  const hasRightTab = col < gridSize - 1 && (col % 2 === 0);
  const hasBottomTab = row < gridSize - 1 && (row % 2 === 0);
  const hasLeftTab = col > 0 && ((col - 1) % 2 === 0);
  const hasTopTab = row > 0 && ((row - 1) % 2 === 0);
  
  const path = [];
  const s = pieceSize - edgePadding * 2; // Effective side length
  
  // Start at top-left corner
  path.push(`M ${edgePadding} ${edgePadding}`);
  
  // Top edge
  if (row === 0) {
    // Straight edge for top row
    path.push(`L ${pieceSize - edgePadding} ${edgePadding}`);
  } else if (hasTopTab) {
    // Top tab (outward)
    path.push(...generateJigsawSide(s, edgePadding, edgePadding, true, 'top').split(' ').filter(Boolean));
  } else {
    // Top blank (inward)
    path.push(...generateJigsawSide(s, edgePadding, edgePadding, false, 'top').split(' ').filter(Boolean));
  }
  
  // Right edge
  if (col === gridSize - 1) {
    // Straight edge for right column
    path.push(`L ${pieceSize - edgePadding} ${pieceSize - edgePadding}`);
  } else if (hasRightTab) {
    // Right tab (outward)
    path.push(...generateJigsawSide(s, pieceSize - edgePadding - s, edgePadding, true, 'right').split(' ').filter(Boolean));
  } else {
    // Right blank (inward)
    path.push(...generateJigsawSide(s, pieceSize - edgePadding - s, edgePadding, false, 'right').split(' ').filter(Boolean));
  }
  
  // Bottom edge
  if (row === gridSize - 1) {
    // Straight edge for bottom row
    path.push(`L ${edgePadding} ${pieceSize - edgePadding}`);
  } else if (hasBottomTab) {
    // Bottom tab (outward)
    path.push(...generateJigsawSide(s, edgePadding, pieceSize - edgePadding - s, true, 'bottom').split(' ').filter(Boolean));
  } else {
    // Bottom blank (inward)
    path.push(...generateJigsawSide(s, edgePadding, pieceSize - edgePadding - s, false, 'bottom').split(' ').filter(Boolean));
  }
  
  // Left edge
  if (col === 0) {
    // Straight edge for left column
    path.push(`L ${edgePadding} ${edgePadding}`);
  } else if (hasLeftTab) {
    // Left tab (outward)
    path.push(...generateJigsawSide(s, edgePadding, edgePadding, true, 'left').split(' ').filter(Boolean));
  } else {
    // Left blank (inward)
    path.push(...generateJigsawSide(s, edgePadding, edgePadding, false, 'left').split(' ').filter(Boolean));
  }
  
  path.push('Z'); // Close the path
  
  return path.join(' ');
}
