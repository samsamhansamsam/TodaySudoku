import { solveBoard, hasUniqueSolution } from "./solver";

// Generate a new Sudoku puzzle with the specified number of clues
// 전역 변수로 오늘의 퍼즐 정보 저장 (난이도 별로 따로 저장)
let dailyPuzzles: {
  [key in "easy" | "medium" | "hard"]?: {
    date: string;
    solvedBoard: number[][];
    cellsToKeep: [number, number][];
  };
} = {};

// UTC 기반 날짜 반환 (YYYY-MM-DD 형식으로 일관되게)
function getGTMDate(): string {
  const now = new Date();
  // 월과 일이 한 자리 수인 경우 앞에 0을 붙여 항상 두 자리로 표현
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}-${day}`;
}

// 완료된 퍼즐 난이도 관리
const COMPLETED_PUZZLES_KEY = "sudoku-completed-puzzles";

export function markDifficultyCompleted(difficulty: string): void {
  try {
    const today = getGTMDate();
    const key = `${today}-${difficulty}`;
    let completed: Record<string, boolean> = {};
    const saved = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    if (saved) {
      completed = JSON.parse(saved);
    }
    completed[key] = true;
    localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(completed));
    console.log(`Marked ${difficulty} as completed for ${today}`);
  } catch (err) {
    console.error("Error marking difficulty as completed:", err);
  }
}

export function isDifficultyCompleted(difficulty: string): boolean {
  try {
    const today = getGTMDate();
    const key = `${today}-${difficulty}`;
    const saved = localStorage.getItem(COMPLETED_PUZZLES_KEY);
    if (!saved) return false;
    const completed = JSON.parse(saved);
    return !!completed[key];
  } catch (err) {
    console.error("Error checking if difficulty completed:", err);
    return false;
  }
}

// 오늘의 날짜를 시드값으로 사용하는 간단한 난수 생성기
function seededRandom(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  return function () {
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

export function generateSudokuPuzzle(
  difficulty: "easy" | "medium" | "hard" = "medium",
): number[][] {
  const today = getGTMDate();
  if (!dailyPuzzles[difficulty] || dailyPuzzles[difficulty]?.date !== today) {
    console.log(
      `Generating new daily puzzle for ${difficulty} difficulty on ${today}`,
    );

    const difficultySpecificSeed = `${today}-${difficulty}`;
    const solvedBoard = generateSolvedBoard(difficultySpecificSeed);
    if (!solvedBoard) {
      throw new Error(
        `Failed to generate solved board for ${difficulty} difficulty`,
      );
    }

    const cellPositions = getAllCellPositions();
    let shuffledCells = seededShuffle(cellPositions, difficultySpecificSeed);
    const additionalSeed = `${difficultySpecificSeed}-unique`;
    let alternateShuffledCells = seededShuffle(cellPositions, additionalSeed);

    // 난이도별로 테스트할 클루 수
    const minRequiredClues = getDifficultyClues(difficulty);

    let uniqueSolutionFound = false;
    let attempts = 0;
    let finalCellsToKeep: [number, number][] = [];

    // 난이도에 따라 다른 최대 시도 횟수 지정
    const maxAttempts = difficulty === "hard" ? 100 : 20;
    let lastShuffled = shuffledCells;
    while (!uniqueSolutionFound && attempts < maxAttempts) {
      attempts++;
      const combinedCells = [
        ...shuffledCells.slice(0, minRequiredClues * 2),
        ...alternateShuffledCells.slice(0, minRequiredClues * 2),
      ];
      const uniqueCells = Array.from(
        new Set(combinedCells.map((cell) => `${cell[0]},${cell[1]}`)),
      ).map((s) => {
        const [row, col] = s.split(",").map(Number);
        return [row, col] as [number, number];
      });

      // 필요한 만큼만 추출
      const testCellsToKeep = uniqueCells.slice(0, minRequiredClues);
      const testPuzzle = solvedBoard.map((row) => [...row]);
      const testSet = new Set(testCellsToKeep.map(([r, c]) => `${r},${c}`));
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!testSet.has(`${r},${c}`)) testPuzzle[r][c] = 0;
        }
      }

      if (hasUniqueSolution(testPuzzle)) {
        uniqueSolutionFound = true;
        finalCellsToKeep = uniqueCells;
        console.log(
          `Found a puzzle with unique solution for ${difficulty} after ${attempts} attempts`,
        );
      } else {
        // 실패할 때마다 마지막으로 섞인 배열을 기록해 두고
        lastShuffled = shuffledCells = seededShuffle(
          shuffledCells,
          difficultySpecificSeed + "-" + attempts,
        );
        alternateShuffledCells = seededShuffle(
          alternateShuffledCells,
          additionalSeed + "-" + attempts,
        );
      }
    }

    if (!uniqueSolutionFound) {
      console.warn(
        `⚠️ ${difficulty}: unique-solution not found, using fallback cells`,
      );
      finalCellsToKeep = lastShuffled;
    }

    // 유일해 보장된 셀 풀 구성
    const cellsPool = finalCellsToKeep;
    const targetClues = getDifficultyClues(difficulty);

    // 부족할 경우 shuffledCells에서 보충
    let pool = [...cellsPool];
    if (pool.length < targetClues) {
      const missing = shuffledCells.filter(
        ([r, c]) => !pool.some(([rr, cc]) => rr === r && cc === c),
      );
      pool = [...pool, ...missing];
    }

    dailyPuzzles[difficulty] = {
      date: today,
      solvedBoard,
      cellsToKeep: pool,
    };
  }

  const clues = getDifficultyClues(difficulty);
  const puzzle = dailyPuzzles[difficulty]!.solvedBoard.map((row) => [...row]);
  const cellsToKeep = dailyPuzzles[difficulty]!.cellsToKeep.slice(0, clues);
  const keepSet = new Set(cellsToKeep.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!keepSet.has(`${r},${c}`)) puzzle[r][c] = 0;
    }
  }

  // 4단계: 최종 퍼즐 상태 확인 → 유일해 / 다중해 / (불가능 시 재생성)
  const isUnique = hasUniqueSolution(puzzle);
  const isSolvable = solveBoard(puzzle.map((row) => [...row]));

  if (isUnique) {
    console.log(
      `✅ Generated ${difficulty} puzzle with ${clues} clues (unique solution)`,
    );
    return puzzle;
  }

  if (isSolvable) {
    console.warn(
      `⚠️ Generated ${difficulty} puzzle with ${clues} clues has multiple solutions (falling back to multi-solution)`,
    );
    return puzzle;
  }

  // (사실상 발생하지 않지만) 만약 전혀 풀리지 않는 퍼즐이면 재생성
  console.error(
    `❌ Fallback puzzle for ${difficulty} with ${clues} clues is unsolvable – regenerating.`,
  );
  return generateSudokuPuzzle(difficulty);
}

function getDifficultyClues(difficulty: "easy" | "medium" | "hard"): number {
  switch (difficulty) {
    case "easy":
      return 75;
    case "medium":
      return 35;
    case "hard":
      return 20;
    default:
      return 35;
  }
}

function generateSolvedBoard(seed?: string): number[][] | null {
  const board = Array(9)
    .fill(0)
    .map(() => Array(9).fill(0));
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const firstRow = seed ? seededShuffle(numbers, seed) : shuffleArray(numbers);
  for (let i = 0; i < 9; i++) board[0][i] = firstRow[i];
  for (let i = 1; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[i][j] = board[i - 1][(j + 3) % 9];
    }
  }
  const copy = board.map((r) => [...r]);
  return solveBoard(copy) ? copy : null;
}

function getAllCellPositions(): [number, number][] {
  const pos: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) pos.push([r, c]);
  return pos;
}

function shuffleArray<T>(array: T[]): T[] {
  const res = [...array];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

// import { solveBoard, hasUniqueSolution } from "./solver";

// // Generate a new Sudoku puzzle with the specified number of clues
// // 전역 변수로 오늘의 퍼즐 정보 저장 (난이도 별로 따로 저장)
// let dailyPuzzles: {
//   [key in "easy" | "medium" | "hard"]?: {
//     date: string;
//     solvedBoard: number[][];
//     cellsToKeep: [number, number][];
//   };
// } = {};

// // UTC 기반 날짜 반환
// function getUTCDate(): string {
//   const now = new Date();
//   return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
// }

// // 완료된 퍼즐 난이도 관리
// const COMPLETED_PUZZLES_KEY = "sudoku-completed-puzzles";

// // 해당 날짜의 특정 난이도를 완료한 것으로 표시
// export function markDifficultyCompleted(difficulty: string): void {
//   try {
//     const today = getUTCDate();
//     const key = `${today}-${difficulty}`;

//     // 기존 완료 목록 로드
//     let completed: Record<string, boolean> = {};
//     const saved = localStorage.getItem(COMPLETED_PUZZLES_KEY);

//     if (saved) {
//       completed = JSON.parse(saved);
//     }

//     // 오늘 날짜의 해당 난이도 완료 표시
//     completed[key] = true;

//     // 저장
//     localStorage.setItem(COMPLETED_PUZZLES_KEY, JSON.stringify(completed));
//     console.log(`Marked ${difficulty} as completed for ${today}`);
//   } catch (err) {
//     console.error("Error marking difficulty as completed:", err);
//   }
// }

// // 해당 날짜의 특정 난이도가 이미 완료되었는지 확인
// export function isDifficultyCompleted(difficulty: string): boolean {
//   try {
//     const today = getUTCDate();
//     const key = `${today}-${difficulty}`;

//     // 기존 완료 목록 로드
//     const saved = localStorage.getItem(COMPLETED_PUZZLES_KEY);
//     if (!saved) return false;

//     const completed = JSON.parse(saved);
//     return !!completed[key];
//   } catch (err) {
//     console.error("Error checking if difficulty completed:", err);
//     return false;
//   }
// }

// // resetCompletedPuzzles 함수는 더 이상 필요하지 않으므로 제거했습니다.

// // 오늘의 날짜를 시드값으로 사용하는 간단한 난수 생성기
// function seededRandom(seed: string): () => number {
//   let s = 0;
//   for (let i = 0; i < seed.length; i++) {
//     s += seed.charCodeAt(i);
//   }

//   return function () {
//     s = Math.sin(s) * 10000;
//     return s - Math.floor(s);
//   };
// }

// // 시드 기반 배열 섞기
// function seededShuffle<T>(array: T[], seed: string): T[] {
//   const random = seededRandom(seed);
//   const result = [...array];

//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }

//   return result;
// }

// export function generateSudokuPuzzle(
//   difficulty: "easy" | "medium" | "hard" = "medium",
// ): number[][] {
//   const today = getUTCDate();

//   // 이 난이도의 오늘 퍼즐이 아직 생성되지 않았거나 날짜가 바뀌었다면 새로 생성
//   if (!dailyPuzzles[difficulty] || dailyPuzzles[difficulty]?.date !== today) {
//     console.log(
//       `Generating new daily puzzle for ${difficulty} difficulty on ${today}`,
//     );

//     // 난이도 별로 다른 시드 값 사용해 일관된 보드 생성
//     const difficultySpecificSeed = `${today}-${difficulty}`;
//     const solvedBoard = generateSolvedBoard(difficultySpecificSeed);
//     if (!solvedBoard) {
//       throw new Error(
//         `Failed to generate solved board for ${difficulty} difficulty`,
//       );
//     }

//     // 시드값 기반으로 고정된 셀 선택
//     const cellPositions = getAllCellPositions();

//     // 난이도별 고유한 셔플: 기본 셀 순서 결정
//     let shuffledCells = seededShuffle(cellPositions, difficultySpecificSeed);

//     // 유일 해를 가진 퍼즐 생성을 위한 최소한의 위치 샘플링
//     // 시드를 약간 변형하여 다양한 위치 집합 생성
//     const additionalSeed = `${difficultySpecificSeed}-unique`;
//     let alternateShuffledCells = seededShuffle(cellPositions, additionalSeed);

//     // 아래 난이도 별 셀 수에 맞춰 유일해 퍼즐을 찾기 위한 최소 클루 수
//     // 일반적으로 17개 이상의 클루가 있어야 유일해가 가능
//     const minRequiredClues = getDifficultyClues(difficulty);

//     // 유일해를 가진 셀 조합 찾기
//     let uniqueSolutionFound = false;
//     let attempts = 0;
//     let finalCellsToKeep: [number, number][] = [];

//     // 최대 5번 시도
//     while (!uniqueSolutionFound && attempts < 20) {
//       attempts++;

//       // 더 다양한 셀 위치 조합 생성
//       const combinedCells = [
//         ...shuffledCells.slice(0, 30),
//         ...alternateShuffledCells.slice(0, 30),
//       ];
//       const uniqueCells = Array.from(
//         new Set(combinedCells.map((cell) => `${cell[0]},${cell[1]}`)),
//       ).map((s) => {
//         const [row, col] = s.split(",").map(Number);
//         return [row, col] as [number, number];
//       });

//       // 필요한 최소 클루 수만큼 선택
//       const testCellsToKeep = uniqueCells.slice(0, minRequiredClues);

//       // 테스트 퍼즐 생성
//       const testPuzzle = solvedBoard.map((row) => [...row]);
//       const testCellsSet = new Set(
//         testCellsToKeep.map(([r, c]) => `${r},${c}`),
//       );

//       // 선택된 셀 외에는 모두 제거
//       for (let row = 0; row < 9; row++) {
//         for (let col = 0; col < 9; col++) {
//           if (!testCellsSet.has(`${row},${col}`)) {
//             testPuzzle[row][col] = 0;
//           }
//         }
//       }

//       // 유일해 확인
//       if (hasUniqueSolution(testPuzzle)) {
//         uniqueSolutionFound = true;
//         finalCellsToKeep = uniqueCells;
//         console.log(
//           `Found a puzzle with unique solution for ${difficulty} after ${attempts} attempts`,
//         );
//       } else {
//         // 다음 시도를 위해 셔플 다시 수행
//         shuffledCells = seededShuffle(
//           shuffledCells,
//           difficultySpecificSeed + "-" + attempts,
//         );
//         alternateShuffledCells = seededShuffle(
//           alternateShuffledCells,
//           additionalSeed + "-" + attempts,
//         );
//       }
//     }

//     // 최종 선택된 셀로 퍼즐 저장
//     // 유일해를 찾지 못한 경우 원래 셔플된 셀 사용
//     dailyPuzzles[difficulty] = {
//       date: today,
//       solvedBoard,
//       cellsToKeep: uniqueSolutionFound ? finalCellsToKeep : shuffledCells,
//     };

//     if (!uniqueSolutionFound) {
//       throw new Error("Could not generate a unique-solution puzzle");
//     }
//   }

//   // 난이도에 따라 공개할 셀 수 결정
//   const clues = getDifficultyClues(difficulty);

//   // 보드 복사
//   const puzzle = dailyPuzzles[difficulty]!.solvedBoard.map((row) => [...row]);

//   // 유지할 셀 선택 (난이도에 따라 다름)
//   const cellsToKeep = dailyPuzzles[difficulty]!.cellsToKeep.slice(0, clues);
//   const cellsToKeepSet = new Set(
//     cellsToKeep.map(([row, col]) => `${row},${col}`),
//   );

//   // 유지할 셀 외에는 모두 삭제
//   for (let row = 0; row < 9; row++) {
//     for (let col = 0; col < 9; col++) {
//       if (!cellsToKeepSet.has(`${row},${col}`)) {
//         puzzle[row][col] = 0;
//       }
//     }
//   }

//   // 퍼즐이 유일해를 갖는지 최종 확인
//   if (!hasUniqueSolution(puzzle)) {
//     console.warn(
//       `Final check failed for ${difficulty} (clues=${clues}), regenerating...`,
//     );
//     return generateSudokuPuzzle(difficulty);
//   }

//   console.log(
//     `Generated ${difficulty} puzzle with ${clues} clues and unique solution`,
//   );
//   return puzzle;
//   // if (!isUnique) {
//   //   console.warn(
//   //     `Warning: ${difficulty} puzzle with ${clues} clues does not have a unique solution`,
//   //   );
//   // }

//   // else {
//   //   console.log(
//   //     `Generated ${difficulty} puzzle with ${clues} clues and unique solution`,
//   //   );
//   // }

//   // return puzzle;
// }

// // Get number of clues based on difficulty
// function getDifficultyClues(difficulty: "easy" | "medium" | "hard"): number {
//   switch (difficulty) {
//     case "easy":
//       return 75; // 쉬운 난이도 - 50개 셀이 공개됨 (50/81 - 약 62%)
//     case "medium":
//       return 35; // 중간 난이도 - 35개 셀이 공개됨 (35/81 - 약 43%)
//     case "hard":
//       return 20; // 어려운 난이도 - 20개 셀이 공개됨 (20/81 - 약 25%)
//     default:
//       return 35;
//   }
// }

// // Generate a fully solved Sudoku board using a seed for consistent generation
// function generateSolvedBoard(seed?: string): number[][] | null {
//   // Start with an empty board
//   const board = Array(9)
//     .fill(0)
//     .map(() => Array(9).fill(0));

//   // Fill in the first row with a seeded permutation of 1-9
//   const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
//   const firstRow = seed ? seededShuffle(numbers, seed) : shuffleArray(numbers);

//   for (let i = 0; i < 9; i++) {
//     board[0][i] = firstRow[i];
//   }

//   // Fill in some additional cells to make the puzzle more solvable
//   for (let i = 1; i < 3; i++) {
//     for (let j = 0; j < 3; j++) {
//       board[i][j] = board[i - 1][(j + 3) % 9];
//     }
//   }

//   // Solve the board
//   const boardCopy = board.map((row) => [...row]);
//   if (solveBoard(boardCopy)) {
//     return boardCopy; // 원본이 아닌 해결된 복사본 반환
//   }

//   // If solving fails, try again
//   return null;
// }

// // Get all possible cell positions as [row, col] pairs
// function getAllCellPositions(): [number, number][] {
//   const positions: [number, number][] = [];
//   for (let row = 0; row < 9; row++) {
//     for (let col = 0; col < 9; col++) {
//       positions.push([row, col]);
//     }
//   }
//   return positions;
// }

// // Fisher-Yates shuffle
// function shuffleArray<T>(array: T[]): T[] {
//   const result = [...array];
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// }
