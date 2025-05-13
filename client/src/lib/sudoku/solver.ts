import { isValidPlacement } from './validator';

// Solve a Sudoku board using backtracking
export function solveBoard(board: number[][]): boolean {
  const emptyCell = findEmptyCell(board);
  
  // If no empty cell is found, the board is solved
  if (!emptyCell) {
    return true;
  }
  
  const [row, col] = emptyCell;
  
  // Try each number from 1 to 9
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      // Place the number if it's valid
      board[row][col] = num;
      
      // Recursively try to solve the rest of the board
      if (solveBoard(board)) {
        return true;
      }
      
      // If solving fails, backtrack by resetting the cell
      board[row][col] = 0;
    }
  }
  
  // No solution found with current board state
  return false;
}

// Find an empty cell in the board
function findEmptyCell(board: number[][]): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

// Create a copy of a board
export function copyBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

// Check if a board has a unique solution
export function hasUniqueSolution(board: number[][]): boolean {
  // Make a copy of the board to avoid modifying the original
  const boardCopy = copyBoard(board);
  
  // Count the number of solutions
  let solutionCount = 0;
  
  // Inner function to count solutions using backtracking
  function countSolutions(board: number[][]): void {
    const emptyCell = findEmptyCell(board);
    
    // If no empty cell is found, we found a solution
    if (!emptyCell) {
      solutionCount++;
      return;
    }
    
    if (solutionCount > 1) {
      return; // Early exit if we already found multiple solutions
    }
    
    const [row, col] = emptyCell;
    
    // Try each number from 1 to 9
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(board, row, col, num)) {
        board[row][col] = num;
        countSolutions(board);
        board[row][col] = 0; // Backtrack
        
        if (solutionCount > 1) {
          return; // Early exit
        }
      }
    }
  }
  
  countSolutions(boardCopy);
  
  return solutionCount === 1;
}
