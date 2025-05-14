import { useEffect } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { useAudio } from "@/lib/stores/useAudio";

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

  // Handle keyboard input for the Sudoku board
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      
      // 퍼즐이 이미 완료된 경우 입력 처리하지 않음
      if (hasWon) return;
      
      // Number keys (1-9)
      if (/^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key);
        
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
      // Delete/Backspace to clear a cell
      else if (e.key === "Backspace" || e.key === "Delete") {
        setCellValue(selectedCell.row, selectedCell.col, 0);
      }
      // Arrow keys for navigation
      else if (e.key === "ArrowLeft" && selectedCell.col > 0) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 });
      }
      else if (e.key === "ArrowRight" && selectedCell.col < 8) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
      }
      else if (e.key === "ArrowUp" && selectedCell.row > 0) {
        setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col });
      }
      else if (e.key === "ArrowDown" && selectedCell.row < 8) {
        setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, setCellValue, setSelectedCell, toggleNote, isNoteMode, validateBoard, hasWon, playSuccess]);

  // Calculate cell styling
  const getCellStyle = (row: number, col: number) => {
    const cellValue = board[row][col];
    const isOriginal = originalBoard[row][col] !== 0;
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    
    // Check if cell is in the same row, column or 3x3 grid as the selected cell
    const isRelatedToSelected = selectedCell && (
      selectedCell.row === row || // Same row
      selectedCell.col === col || // Same column
      (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && 
       Math.floor(selectedCell.col / 3) === Math.floor(col / 3)) // Same 3x3 box
    );
    
    // Check if the selected cell contains a number and if this cell has the same number
    const isMatchingSelectedNumber = selectedCell && 
      board[selectedCell.row][selectedCell.col] !== 0 && 
      cellValue === board[selectedCell.row][selectedCell.col] &&
      (selectedCell.row !== row || selectedCell.col !== col); // Not the selected cell itself
    
    const isSameNumber = cellValue !== 0 && board.some((r, rIdx) => 
      r.some((c, cIdx) => 
        c === cellValue && (rIdx !== row || cIdx !== col)
      )
    );
    
    // Calculate if there's a conflict
    const hasConflict = cellValue !== 0 && !isValidPlacement(row, col, cellValue);

    let className = "flex items-center justify-center relative aspect-square h-full";
    
    // Border styling - Add thin border for all cells
    className += " border border-slate-300";
    
    // Add thicker borders for 3x3 grid boundaries
    if (col === 0) className += " border-l-2 border-l-slate-500";
    if (col === 8) className += " border-r-2 border-r-slate-500";
    if (row === 0) className += " border-t-2 border-t-slate-500";
    if (row === 8) className += " border-b-2 border-b-slate-500";
    if (col % 3 === 2 && col < 8) className += " border-r-2 border-r-slate-500";
    if (row % 3 === 2 && row < 8) className += " border-b-2 border-b-slate-500";
    
    // Background color - Prioritized for visual clarity
    if (isSelected) {
      // Selected cell gets highest priority with the most distinct color
      className += " bg-blue-300";
    } else if (isMatchingSelectedNumber) {
      // Cells with same number as selected cell get a unique highlight color
      className += " bg-purple-100";
    } else if (isRelatedToSelected && isOriginal) {
      // Overlapping regions (original number cell in the same row/col/box as selected)
      className += " bg-green-50";
    } else if (isRelatedToSelected) {
      // Regular cells in the same row/col/box as selected
      className += " bg-blue-50";
    } else if (isOriginal) {
      // Original cells provided at game start
      className += " bg-amber-50";
    } else if (isSameNumber && cellValue !== 0) {
      // Numbers that occur multiple times on the board
      className += " bg-slate-50";
    }
    
    // Text color
    let textClass = "";
    if (isOriginal) {
      textClass += " text-blue-800 font-semibold";
    } else if (hasConflict) {
      textClass += " text-red-600";
    } else {
      textClass += " text-slate-900";
    }
    
    // Add shadow on hovering
    className += " hover:shadow-inner";
    
    return { cellClass: className, textClass };
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    playHit();
  };

  return (
    <div className="grid grid-cols-9 border border-slate-400 bg-white w-full aspect-square select-none touch-manipulation">
      {board.map((rowValues, rowIndex) => 
        rowValues.map((cellValue, colIndex) => {
          const { cellClass, textClass } = getCellStyle(rowIndex, colIndex);
          const cellNotes = notes[rowIndex][colIndex];
          
          return (
            <div 
              key={`cell-${rowIndex}-${colIndex}`}
              className={`${cellClass} min-h-[28px] md:min-h-[40px]`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cellValue !== 0 ? (
                <span className={`text-xl md:text-2xl ${textClass}`}>{cellValue}</span>
              ) : (
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <span key={num} className="text-[7px] sm:text-[8px] md:text-[10px] flex items-center justify-center text-slate-600">
                      {cellNotes.includes(num) ? num : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
