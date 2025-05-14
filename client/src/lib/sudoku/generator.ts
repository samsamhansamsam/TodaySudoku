import { solveBoard, hasUniqueSolution } from "./solver";

// Generate a new Sudoku puzzle with the specified number of clues
// 전역 변수로 오늘의 퍼즐 정보 저장
let dailyPuzzle: {
  date: string;
  solvedBoard: number[][];
  cellsToKeep: [number, number][];
} | null = null;

// GTM 기반 날짜 반환
function getGTMDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

// 오늘의 날짜를 시드값으로 사용하는 간단한 난수 생성기
function seededRandom(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s += seed.charCodeAt(i);
  }
  
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

// 시드 기반 배열 섞기
function seededShuffle<T>(array: T[], seed: string): T[] {
  const random = seededRandom(seed);
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

export function generateSudokuPuzzle(difficulty: "easy" | "medium" | "hard" = "medium"): number[][] {
  const today = getGTMDate();
  
  // 오늘의 퍼즐이 아직 생성되지 않았거나 날짜가 바뀌었다면 새로 생성
  if (!dailyPuzzle || dailyPuzzle.date !== today) {
    console.log("Generating new daily puzzle for", today);
    
    // 시드값 기반으로 일관된 보드 생성
    const solvedBoard = generateSolvedBoard(today);
    if (!solvedBoard) {
      throw new Error("Failed to generate solved board");
    }
    
    // 시드값 기반으로 고정된 셀 선택
    const cellPositions = getAllCellPositions();
    const shuffledCells = seededShuffle(cellPositions, today);
    
    // 오늘의 퍼즐 정보 저장
    dailyPuzzle = {
      date: today,
      solvedBoard,
      cellsToKeep: shuffledCells
    };
  }
  
  // 난이도에 따라 공개할 셀 수 결정
  const clues = getDifficultyClues(difficulty);
  
  // 보드 복사
  const puzzle = dailyPuzzle.solvedBoard.map(row => [...row]);
  
  // 유지할 셀 선택 (난이도에 따라 다름)
  const cellsToKeep = dailyPuzzle.cellsToKeep.slice(0, clues);
  const cellsToKeepSet = new Set(cellsToKeep.map(([row, col]) => `${row},${col}`));
  
  // 유지할 셀 외에는 모두 삭제
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!cellsToKeepSet.has(`${row},${col}`)) {
        puzzle[row][col] = 0;
      }
    }
  }
  
  // 퍼즐이 유일해를 갖는지 확인
  if (!hasUniqueSolution(puzzle)) {
    console.warn("Warning: Daily puzzle does not have a unique solution");
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

// Generate a fully solved Sudoku board using a seed for consistent generation
function generateSolvedBoard(seed?: string): number[][] | null {
  // Start with an empty board
  const board = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Fill in the first row with a seeded permutation of 1-9
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const firstRow = seed 
    ? seededShuffle(numbers, seed) 
    : shuffleArray(numbers);
  
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
  const boardCopy = board.map(row => [...row]);
  if (solveBoard(boardCopy)) {
    return boardCopy; // 원본이 아닌 해결된 복사본 반환
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
