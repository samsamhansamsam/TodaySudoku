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
    
    // 첫 번째 셔플: 기본 셀 순서 결정
    let shuffledCells = seededShuffle(cellPositions, today);
    
    // 유일 해를 가진 퍼즐 생성을 위한 최소한의 위치 샘플링
    // 시드를 약간 변형하여 다양한 위치 집합 생성
    const additionalSeed = today + "-unique";
    let alternateShuffledCells = seededShuffle(cellPositions, additionalSeed);
    
    // 아래 난이도 별 셀 수에 맞춰 유일해 퍼즐을 찾기 위한 최소 클루 수
    // 일반적으로 17개 이상의 클루가 있어야 유일해가 가능
    const minRequiredClues = 20; // 하드 난이도에 맞춤

    // 유일해를 가진 셀 조합 찾기
    let uniqueSolutionFound = false;
    let attempts = 0;
    let finalCellsToKeep: [number, number][] = [];
    
    // 최대 5번 시도
    while (!uniqueSolutionFound && attempts < 5) {
      attempts++;
      
      // 더 다양한 셀 위치 조합 생성
      const combinedCells = [...shuffledCells.slice(0, 30), ...alternateShuffledCells.slice(0, 30)];
      const uniqueCells = Array.from(new Set(combinedCells.map(cell => `${cell[0]},${cell[1]}`))).map(s => {
        const [row, col] = s.split(',').map(Number);
        return [row, col] as [number, number];
      });
      
      // 필요한 최소 클루 수만큼 선택
      const testCellsToKeep = uniqueCells.slice(0, minRequiredClues);
      
      // 테스트 퍼즐 생성
      const testPuzzle = solvedBoard.map(row => [...row]);
      const testCellsSet = new Set(testCellsToKeep.map(([r, c]) => `${r},${c}`));
      
      // 선택된 셀 외에는 모두 제거
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!testCellsSet.has(`${row},${col}`)) {
            testPuzzle[row][col] = 0;
          }
        }
      }
      
      // 유일해 확인
      if (hasUniqueSolution(testPuzzle)) {
        uniqueSolutionFound = true;
        finalCellsToKeep = uniqueCells;
        console.log("Found a puzzle with unique solution after", attempts, "attempts");
      } else {
        // 다음 시도를 위해 셔플 다시 수행
        shuffledCells = seededShuffle(shuffledCells, today + "-" + attempts);
        alternateShuffledCells = seededShuffle(alternateShuffledCells, additionalSeed + "-" + attempts);
      }
    }
    
    // 최종 선택된 셀로 퍼즐 저장
    // 유일해를 찾지 못한 경우 원래 셔플된 셀 사용
    dailyPuzzle = {
      date: today,
      solvedBoard,
      cellsToKeep: uniqueSolutionFound ? finalCellsToKeep : shuffledCells
    };
    
    if (!uniqueSolutionFound) {
      console.warn("Could not find a puzzle with unique solution after multiple attempts, using fallback");
    }
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
  
  // 퍼즐이 유일해를 갖는지 최종 확인
  const isUnique = hasUniqueSolution(puzzle);
  if (!isUnique) {
    console.warn(`Warning: ${difficulty} puzzle with ${clues} clues does not have a unique solution`);
  } else {
    console.log(`Generated ${difficulty} puzzle with ${clues} clues and unique solution`);
  }
  
  return puzzle;
}

// Get number of clues based on difficulty
function getDifficultyClues(difficulty: "easy" | "medium" | "hard"): number {
  switch (difficulty) {
    case "easy":
      return 70; // 요청에 따라 70개 셀이 공개됨 (70/81 - 약 86%)
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
