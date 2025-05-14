import { solveBoard, hasUniqueSolution } from "./solver";

// Generate a new Sudoku puzzle with the specified number of clues
export function generateSudokuPuzzle(difficulty: "easy" | "medium" | "hard" = "medium"): number[][] {
  // Create a solved board
  const solvedBoard = generateSolvedBoard();
  if (!solvedBoard) {
    throw new Error("Failed to generate solved board");
  }

  // Determine number of clues based on difficulty
  const clues = getDifficultyClues(difficulty);
  
  // Create a copy to work with
  let puzzle = solvedBoard.map(row => [...row]);
  
  // Randomly remove numbers to create the puzzle
  const cells = shuffleArray(getAllCellPositions());
  
  // Try to create a puzzle with a unique solution
  let attempts = 0;
  let isUnique = false;
  
  while (!isUnique && attempts < 10) {
    attempts++;
    
    // Reset the puzzle
    puzzle = solvedBoard.map(row => [...row]);
    
    // Cells to keep (clues)
    const cellsToKeep = cells.slice(0, clues);
    const cellsToKeepSet = new Set(cellsToKeep.map(([row, col]) => `${row},${col}`));
    
    // Remove all cells except the ones to keep
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!cellsToKeepSet.has(`${row},${col}`)) {
          puzzle[row][col] = 0;
        }
      }
    }
    
    // Check if the puzzle has a unique solution
    isUnique = hasUniqueSolution(puzzle);
    
    // If we've found a unique solution or we're out of attempts, exit the loop
    if (isUnique || attempts >= 10) {
      if (!isUnique && attempts >= 10) {
        console.warn("Could not generate a puzzle with a unique solution after multiple attempts");
      }
      break;
    }
  }
  
  return puzzle;
}

// Get number of clues based on difficulty
function getDifficultyClues(difficulty: "easy" | "medium" | "hard"): number {
  switch (difficulty) {
    case "easy":
      return 40; // 많은 힌트로 초보자도 쉽게 풀 수 있는 난이도 (40/81 cells filled)
    case "medium":
      return 30; // 적당한 도전이 있는 일반적인 난이도 (30/81 cells filled)
    case "hard":
      return 20; // 고급 기술이 필요한 어려운 난이도 (20/81 cells filled)
    default:
      return 30;
  }
}

// Generate a fully solved Sudoku board
function generateSolvedBoard(): number[][] | null {
  // Start with an empty board
  const board = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Fill in the first row with a random permutation of 1-9
  const firstRow = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 9; i++) {
    board[0][i] = firstRow[i];
  }
  
  // Fill in some additional cells to make the puzzle more solvable
  for (let i = 1; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[i][j] = board[i-1][(j+3) % 9];
    }
  }
  
  // Solve the board
  if (solveBoard(board)) {
    return board;
  }
  
  // If solving fails, try again
  return null;
}

// Get all possible cell positions as [row, col] pairs
function getAllCellPositions(): [number, number][] {
  const positions: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  return positions;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
