// Validate an entire Sudoku board
export function validateSudokuBoard(board: number[][]): boolean {
  // Check all rows
  for (let row = 0; row < 9; row++) {
    if (!isValidUnit(board[row])) {
      return false;
    }
  }

  // Check all columns
  for (let col = 0; col < 9; col++) {
    const column = board.map(row => row[col]);
    if (!isValidUnit(column)) {
      return false;
    }
  }

  // Check all 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const box = getBox(board, boxRow, boxCol);
      if (!isValidUnit(box)) {
        return false;
      }
    }
  }

  return true;
}

// Check if a board is complete (all cells filled)
export function isBoardComplete(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
}

// Check if a specific cell value is valid in its row, column, and box
export function isValidPlacement(board: number[][], row: number, col: number, value: number): boolean {
  if (value === 0) return true; // Empty cells are always valid
  
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === value) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === value) {
      return false;
    }
  }

  // Check 3x3 box
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  
  for (let r = boxStartRow; r < boxStartRow + 3; r++) {
    for (let c = boxStartCol; c < boxStartCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

// Check if a unit (row, column, or box) is valid
function isValidUnit(unit: number[]): boolean {
  const seen = new Set<number>();
  
  for (const num of unit) {
    if (num === 0) continue; // Skip empty cells
    
    if (seen.has(num)) {
      return false; // Duplicate found
    }
    
    seen.add(num);
  }
  
  return true;
}

// Extract a 3x3 box from the board as a flat array
function getBox(board: number[][], boxRow: number, boxCol: number): number[] {
  const box: number[] = [];
  
  const startRow = boxRow * 3;
  const startCol = boxCol * 3;
  
  for (let row = startRow; row < startRow + 3; row++) {
    for (let col = startCol; col < startCol + 3; col++) {
      box.push(board[row][col]);
    }
  }
  
  return box;
}
