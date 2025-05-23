import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { generateSudokuPuzzle } from "../sudoku/generator";
import { validateSudokuBoard, isBoardComplete, isValidPlacement } from "../sudoku/validator";
import { copyBoard, solveBoard } from "../sudoku/solver";
import { useAudio } from "./useAudio";

export type Cell = {
  row: number;
  col: number;
};

type SudokuState = {
  // Board data
  board: number[][];
  originalBoard: number[][];
  solution: number[][] | null;
  
  // Game state
  difficulty: "easy" | "medium" | "hard";
  selectedCell: Cell | null;
  isNoteMode: boolean;
  notes: number[][][];
  
  // Game status
  isComplete: boolean;
  hasWon: boolean;
  
  // Timer
  elapsedSeconds: number;
  timerInterval: number | null;
  
  // Actions
  setDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  setSelectedCell: (cell: Cell | null) => void;
  setCellValue: (row: number, col: number, value: number) => void;
  generateNewGame: (difficulty?: "easy" | "medium" | "hard") => void;
  checkSolution: () => boolean;
  resetGame: () => void;
  toggleNoteMode: () => void;
  toggleNote: (row: number, col: number, value: number) => void;
  clearCell: (row: number, col: number) => void;
  isValidPlacement: (row: number, col: number, value: number) => boolean;
  validateBoard: () => boolean;
  
  // Timer control
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
};

type SudokuStateStorage = Pick<
  SudokuState, 
  'board' | 'originalBoard' | 'solution' | 'difficulty' | 
  'selectedCell' | 'isNoteMode' | 'notes' | 
  'isComplete' | 'hasWon' | 'elapsedSeconds'
>;

// 문제를 해결하기 위해 create 메서드에 타입 매개변수 추가
export const useSudoku = create<SudokuState>()(
  persist<SudokuState, SudokuStateStorage>(
    (set, get) => ({
  // Initial state
  board: Array(9).fill(0).map(() => Array(9).fill(0)),
  originalBoard: Array(9).fill(0).map(() => Array(9).fill(0)),
  solution: null,
  difficulty: "easy",
  selectedCell: null,
  isNoteMode: false,
  notes: Array(9).fill(0).map(() => Array(9).fill(0).map(() => [])),
  isComplete: false,
  hasWon: false,
  elapsedSeconds: 0,
  timerInterval: null,
  
  // Set difficulty level
  setDifficulty: (difficulty) => {
    set({ difficulty });
  },
  
  // Set the currently selected cell
  setSelectedCell: (cell) => {
    set({ selectedCell: cell });
  },
  
  // Set a value in a cell
  setCellValue: (row, col, value) => {
    const { board, originalBoard } = get();
    
    // Don't modify original (clue) cells
    if (originalBoard[row][col] !== 0) {
      return;
    }
    
    // Create new board with the updated value
    const newBoard = board.map((r, rowIndex) => 
      rowIndex === row
        ? r.map((c, colIndex) => colIndex === col ? value : c)
        : [...r]
    );
    
    // Clear notes for this cell if setting a value
    let newNotes = [...get().notes];
    if (value !== 0) {
      newNotes = newNotes.map((r, rowIndex) => 
        rowIndex === row
          ? r.map((c, colIndex) => colIndex === col ? [] : c)
          : [...r]
      );
    }
    
    // Check if the board is complete and valid
    const complete = isBoardComplete(newBoard);
    const valid = validateSudokuBoard(newBoard);
    const hasWon = complete && valid;
    
    set({ 
      board: newBoard, 
      notes: newNotes,
      isComplete: complete,
      hasWon
    });
  },
  
  // Generate a new game
  generateNewGame: (difficulty) => {
    const { stopTimer, resetTimer } = get();
    
    // Use provided difficulty or current setting
    const diff = difficulty || get().difficulty;
    
    // Generate a new puzzle
    const puzzle = generateSudokuPuzzle(diff);
    
    // Save a copy as the original board (for tracking clues)
    const originalBoard = copyBoard(puzzle);
    
    // Create a solution by solving the board
    const solution = copyBoard(puzzle);
    solveBoard(solution);
    
    // Initialize empty notes for all cells
    const notes = Array(9).fill(0).map(() => Array(9).fill(0).map(() => []));
    
    // Reset timer
    stopTimer();
    resetTimer();
    
    set({ 
      board: puzzle, 
      originalBoard,
      solution,
      notes,
      difficulty: diff,
      selectedCell: null,
      isComplete: false,
      hasWon: false
    });
  },
  
  // Check if the current board matches the solution
  checkSolution: () => {
    const { board } = get();
    
    const isComplete = isBoardComplete(board);
    const isValid = validateSudokuBoard(board);
    const hasWon = isComplete && isValid;
    
    set({ isComplete, hasWon });
    
    return hasWon;
  },
  
  // Reset the game to the original board (clues only)
  resetGame: () => {
    const { originalBoard } = get();
    
    set({
      board: copyBoard(originalBoard),
      notes: Array(9).fill(0).map(() => Array(9).fill(0).map(() => [])),
      selectedCell: null,
      isComplete: false,
      hasWon: false
    });
  },
  
  // Toggle note mode
  toggleNoteMode: () => {
    set(state => ({ isNoteMode: !state.isNoteMode }));
  },
  
  // Toggle a note in a cell
  toggleNote: (row, col, value) => {
    const { notes, originalBoard, board } = get();
    
    // Don't add notes to original (clue) cells or cells with values
    if (originalBoard[row][col] !== 0 || board[row][col] !== 0) {
      return;
    }
    
    // Toggle the note (add if not present, remove if present)
    const cellNotes = [...notes[row][col]];
    const noteIndex = cellNotes.indexOf(value);
    
    if (noteIndex === -1) {
      cellNotes.push(value);
    } else {
      cellNotes.splice(noteIndex, 1);
    }
    
    // Create new notes array with the updated cell
    const newNotes = notes.map((r, rowIndex) => 
      rowIndex === row
        ? r.map((c, colIndex) => colIndex === col ? cellNotes : c)
        : [...r]
    );
    
    set({ notes: newNotes });
  },
  
  // Clear a cell (remove value and notes)
  clearCell: (row, col) => {
    const { originalBoard } = get();
    
    // Don't clear original (clue) cells
    if (originalBoard[row][col] !== 0) {
      return;
    }
    
    // Create new board with the cell cleared
    const { board, notes } = get();
    const newBoard = board.map((r, rowIndex) => 
      rowIndex === row
        ? r.map((c, colIndex) => colIndex === col ? 0 : c)
        : [...r]
    );
    
    // Clear notes for this cell
    const newNotes = notes.map((r, rowIndex) => 
      rowIndex === row
        ? r.map((c, colIndex) => colIndex === col ? [] : c)
        : [...r]
    );
    
    set({ 
      board: newBoard,
      notes: newNotes,
      isComplete: false,
      hasWon: false
    });
  },
  
  // Check if a value is valid in a specific cell
  isValidPlacement: (row, col, value) => {
    const { board } = get();
    return isValidPlacement(board, row, col, value);
  },
  
  // Validate the entire board
  validateBoard: () => {
    const { board } = get();
    const isComplete = isBoardComplete(board);
    const isValid = validateSudokuBoard(board);
    const hasWon = isComplete && isValid;
    
    set({ isComplete, hasWon });
    
    return isValid;
  },
  
  // Start the timer
  startTimer: () => {
    const { timerInterval } = get();
    
    // Don't create a new interval if one exists
    if (timerInterval !== null) {
      return;
    }
    
    const interval = window.setInterval(() => {
      set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);
    
    set({ timerInterval: interval });
  },
  
  // Stop the timer
  stopTimer: () => {
    const { timerInterval } = get();
    
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },
  
  // Reset the timer
  resetTimer: () => {
    const { timerInterval } = get();
    
    // 실행 중인 타이머가 있으면 정지
    if (timerInterval !== null) {
      clearInterval(timerInterval);
    }
    
    // 경과 시간을 0으로 초기화하고 타이머 인터벌도 초기화
    set({ 
      elapsedSeconds: 0,
      timerInterval: null
    });
  }
}), {
  name: "sudoku-storage", // 저장소 이름
  version: 1, // 스토리지 버전
  storage: {
    getItem: (name) => {
      // localStorage에서 먼저 시도하고, sessionStorage 폴백
      const persistedState = localStorage.getItem(name) || sessionStorage.getItem(name);
      return persistedState ? JSON.parse(persistedState) : null;
    },
    setItem: (name, value) => {
      try {
        // localStorage와 sessionStorage 모두에 저장
        localStorage.setItem(name, JSON.stringify(value));
        sessionStorage.setItem(name, JSON.stringify(value));
      } catch (err) {
        console.error("Error saving state:", err);
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
        sessionStorage.removeItem(name);
      } catch (err) {
        console.error("Error removing state:", err);
      }
    },
  },
  partialize: (state) => {
    // 필요한 데이터만 선택적으로 저장 (Partial<SudokuState>)
    return {
      board: state.board,
      originalBoard: state.originalBoard,
      solution: state.solution,
      difficulty: state.difficulty,
      selectedCell: state.selectedCell,
      isNoteMode: state.isNoteMode,
      notes: state.notes,
      isComplete: state.isComplete,
      hasWon: state.hasWon,
      elapsedSeconds: state.elapsedSeconds,
    };
  },
})
);
