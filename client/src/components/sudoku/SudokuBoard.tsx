import { useEffect, useState } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { useAudio } from "@/lib/stores/useAudio";
import { k, destroyAll } from "@/lib/kaboom/setup";

export default function SudokuBoard() {
  const { 
    board, 
    originalBoard, 
    selectedCell, 
    setSelectedCell,
    setCellValue,
    isValidPlacement,
    notes,
    toggleNote,
    isNoteMode,
    validateBoard,
    hasWon
  } = useSudoku();
  
  const { playHit, playSuccess } = useAudio();

  // Track if kaboom is initialized
  const [isKaboomInitialized, setIsKaboomInitialized] = useState(false);

  // Render the Sudoku board using Kaboom
  useEffect(() => {
    if (!k || !board.length) {
      console.log("No kaboom instance or board is empty");
      return;
    }

    console.log("Rendering board with Kaboom");
    setIsKaboomInitialized(true);
    
    // Clear previous scene
    k.destroyAll();

    // Get dimensions for the grid
    const kWidth = k.width();
    const kHeight = k.height();
    const CELL_SIZE = Math.min(kWidth, kHeight) / 9;
    const GRID_SIZE = CELL_SIZE * 9;
    const OFFSET_X = (kWidth - GRID_SIZE) / 2;
    const OFFSET_Y = (kHeight - GRID_SIZE) / 2;
    
    // Colors
    const GRID_BG = k.rgb(248, 250, 252);
    const GRID_LINES = k.rgb(203, 213, 225);
    const GRID_LINES_STRONG = k.rgb(71, 85, 105);
    const CELL_SELECTED = k.rgb(221, 234, 255);
    const CELL_SAME_NUMBER = k.rgb(241, 245, 249);
    const CELL_ORIGINAL = k.rgb(243, 244, 246);
    const TEXT_COLOR = k.rgb(15, 23, 42);
    const TEXT_ORIGINAL = k.rgb(30, 64, 175);
    const TEXT_CONFLICT = k.rgb(220, 38, 38);
    const NOTE_COLOR = k.rgb(100, 116, 139);

    // Draw background
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(GRID_BG),
      k.z(-10),
    ]);

    // Draw cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const x = OFFSET_X + col * CELL_SIZE;
        const y = OFFSET_Y + row * CELL_SIZE;
        const cellValue = board[row][col];
        const isOriginal = originalBoard[row][col] !== 0;
        const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
        const isSameNumber = cellValue !== 0 && board.some((r, rIdx) => 
          r.some((c, cIdx) => 
            c === cellValue && (rIdx !== row || cIdx !== col)
          )
        );
        
        // Calculate if there's a conflict
        const hasConflict = cellValue !== 0 && !isValidPlacement(row, col, cellValue);

        // Draw cell background
        let bgColor = GRID_BG;
        if (isSelected) {
          bgColor = CELL_SELECTED;
        } else if (isOriginal) {
          bgColor = CELL_ORIGINAL;
        } else if (isSameNumber && cellValue !== 0) {
          bgColor = CELL_SAME_NUMBER;
        }
        
        k.add([
          k.rect(CELL_SIZE, CELL_SIZE),
          k.pos(x, y),
          k.color(bgColor),
          k.z(-5),
          "cell",
          {
            row,
            col,
            cellSize: CELL_SIZE,
          },
        ]);

        // Draw cell value
        if (cellValue !== 0) {
          let textColor = isOriginal ? TEXT_ORIGINAL : TEXT_COLOR;
          if (hasConflict && !isOriginal) {
            textColor = TEXT_CONFLICT;
          }
          
          k.add([
            k.text(cellValue.toString(), {
              size: CELL_SIZE * 0.6,
              font: "sans-serif",
            }),
            k.pos(x + CELL_SIZE / 2, y + CELL_SIZE / 2),
            k.color(textColor),
            k.anchor("center"),
            k.z(1),
          ]);
        } else {
          // Draw notes if cell is empty
          const cellNotes = notes[row][col];
          if (cellNotes.length > 0) {
            const NOTE_SIZE = CELL_SIZE * 0.2;
            const START_X = x + CELL_SIZE * 0.1;
            const START_Y = y + CELL_SIZE * 0.1;
            
            cellNotes.forEach((note) => {
              const noteRow = Math.floor((note - 1) / 3);
              const noteCol = (note - 1) % 3;
              const noteX = START_X + noteCol * (CELL_SIZE / 3);
              const noteY = START_Y + noteRow * (CELL_SIZE / 3);
              
              k.add([
                k.text(note.toString(), {
                  size: NOTE_SIZE,
                  font: "sans-serif",
                }),
                k.pos(noteX, noteY),
                k.color(NOTE_COLOR),
                k.z(1),
              ]);
            });
          }
        }
      }
    }

    // Draw grid lines
    for (let i = 0; i <= 9; i++) {
      const lineWidth = i % 3 === 0 ? 2 : 1;
      const lineColor = i % 3 === 0 ? GRID_LINES_STRONG : GRID_LINES;
      
      // Vertical lines
      k.add([
        k.rect(lineWidth, GRID_SIZE),
        k.pos(OFFSET_X + i * CELL_SIZE - lineWidth / 2, OFFSET_Y),
        k.color(lineColor),
        k.z(0),
      ]);
      
      // Horizontal lines
      k.add([
        k.rect(GRID_SIZE, lineWidth),
        k.pos(OFFSET_X, OFFSET_Y + i * CELL_SIZE - lineWidth / 2),
        k.color(lineColor),
        k.z(0),
      ]);
    }

    // Handle mouse clicks
    k.onClick("cell", (cell) => {
      setSelectedCell({ row: cell.row, col: cell.col });
      playHit();
    });

    // Handle keyboard input
    k.onKeyPress((key) => {
      if (!selectedCell) return;
      
      // Handle number input
      if (key >= "1" && key <= "9") {
        const num = parseInt(key);
        
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, num);
        } else {
          setCellValue(selectedCell.row, selectedCell.col, num);
          
          // Validate board after setting a value
          const isValid = validateBoard();
          if (isValid && hasWon) {
            playSuccess();
          }
        }
      } 
      // Handle delete/backspace
      else if (key === "backspace" || key === "delete") {
        setCellValue(selectedCell.row, selectedCell.col, 0);
      }
      // Arrow keys for navigation
      else if (key === "left" && selectedCell.col > 0) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 });
      }
      else if (key === "right" && selectedCell.col < 8) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
      }
      else if (key === "up" && selectedCell.row > 0) {
        setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col });
      }
      else if (key === "down" && selectedCell.row < 8) {
        setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
      }
    });

    // Global onClick to handle clicking outside the grid
    k.onClick(() => {
      // This will run for any click not caught by a specific object
      const mousePos = k.mousePos();
      const gridLeft = OFFSET_X;
      const gridRight = OFFSET_X + GRID_SIZE;
      const gridTop = OFFSET_Y;
      const gridBottom = OFFSET_Y + GRID_SIZE;
      
      if (
        mousePos.x < gridLeft ||
        mousePos.x > gridRight ||
        mousePos.y < gridTop ||
        mousePos.y > gridBottom
      ) {
        setSelectedCell(null);
      }
    });

  }, [board, originalBoard, selectedCell, isNoteMode, notes, hasWon]);

  return null;
}
