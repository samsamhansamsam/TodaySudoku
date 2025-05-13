import { solveBoard } from "./solver";

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
  const puzzle = solvedBoard.map(row => [...row]);
  
  // Randomly remove numbers to create the puzzle
  const cells = shuffleArray(getAllCellPositions());
  const totalCellsToRemove = 81 - clues;
  
  for (let i = 0; i < totalCellsToRemove; i++) {
    const [row, col] = cells[i];
    puzzle[row][col] = 0;
  }
  
  return puzzle;
}

// Get number of clues based on difficulty
function getDifficultyClues(difficulty: "easy" | "medium" | "hard"): number {
  switch (difficulty) {
    case "easy":
      return 35; // More clues for easier puzzles
    case "medium":
      return 28;
    case "hard":
      return 23; // Fewer clues for harder puzzles
    default:
      return 28;
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
