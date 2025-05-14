import { Button } from "@/components/ui/button";
import { 
  Pencil,
  Eraser, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown
} from "lucide-react";
import { useEffect } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { useAudio } from "@/lib/stores/useAudio";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

export default function Controls() {
  const { 
    selectedCell, 
    setSelectedCell, 
    setCellValue, 
    isNoteMode, 
    toggleNoteMode,
    clearCell,
    originalBoard,
    toggleNote,
    board
  } = useSudoku();
  
  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  
  // Count how many times each number appears on the board
  const numberCounts = Array(10).fill(0); // 0-9 (we ignore index 0)
  
  // Calculate the count of each number on the board
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      if (value > 0) {
        numberCounts[value]++;
      }
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      
      // Number keys
      if (/^[1-9]$/.test(e.key)) {
        playHit();
        const num = parseInt(e.key);
        
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, num);
        } else {
          setCellValue(selectedCell.row, selectedCell.col, num);
        }
      }
      
      // Arrow keys for navigation
      switch (e.key) {
        case "ArrowLeft":
          if (selectedCell.col > 0) {
            setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 });
          }
          break;
        case "ArrowRight":
          if (selectedCell.col < 8) {
            setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
          }
          break;
        case "ArrowUp":
          if (selectedCell.row > 0) {
            setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col });
          }
          break;
        case "ArrowDown":
          if (selectedCell.row < 8) {
            setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
          }
          break;
        case "Delete":
        case "Backspace":
          clearCell(selectedCell.row, selectedCell.col);
          break;
        case "n":
          toggleNoteMode();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isNoteMode]);

  const handleNumberClick = (num: number) => {
    if (!selectedCell) return;
    playHit();
    
    if (isNoteMode) {
      toggleNote(selectedCell.row, selectedCell.col, num);
    } else {
      setCellValue(selectedCell.row, selectedCell.col, num);
    }
  };

  const handleArrowClick = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;
    
    switch (direction) {
      case 'left':
        if (selectedCell.col > 0) {
          setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 });
        }
        break;
      case 'right':
        if (selectedCell.col < 8) {
          setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
        }
        break;
      case 'up':
        if (selectedCell.row > 0) {
          setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col });
        }
        break;
      case 'down':
        if (selectedCell.row < 8) {
          setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
        }
        break;
    }
  };

  // Check if selected cell is an original cell (provided at start)
  const isOriginalCell = selectedCell ? originalBoard[selectedCell.row][selectedCell.col] !== 0 : false;

  return (
    <div className="w-full max-w-md">
      {/* Number buttons */}
      <div className="grid grid-cols-9 gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          // Check if the number has been placed 9 times (maximum for Sudoku)
          const isFullyPlaced = numberCounts[num] >= 9;
          
          return (
            <Button
              key={num}
              variant="outline"
              className={cn(
                "aspect-square text-lg font-medium relative",
                isMobile ? "h-10 w-10" : "",
                isFullyPlaced ? "opacity-30" : ""
              )}
              onClick={() => handleNumberClick(num)}
              disabled={!selectedCell || isOriginalCell || isFullyPlaced}
            >
              {num}
              {isFullyPlaced && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                  <div className="w-full border-t border-red-500"></div>
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={isNoteMode ? "default" : "outline"}
          className={cn(
            "gap-1",
            isMobile ? "h-12 px-3" : ""
          )}
          onClick={toggleNoteMode}
          disabled={!selectedCell || isOriginalCell}
        >
          <Pencil className={cn("h-4 w-4", isMobile ? "h-5 w-5" : "")} />
          <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>Notes</span>
        </Button>
        
        <Button
          variant="outline"
          className={cn(
            "gap-1",
            isMobile ? "h-12 px-3" : ""
          )}
          onClick={() => selectedCell && clearCell(selectedCell.row, selectedCell.col)}
          disabled={!selectedCell || isOriginalCell}
        >
          <Eraser className={cn("h-4 w-4", isMobile ? "h-5 w-5" : "")} />
          <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>Erase</span>
        </Button>
      </div>

      {/* Arrow controls for mobile */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto">
          <div className="col-start-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleArrowClick('up')}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="col-start-1 col-end-2 row-start-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleArrowClick('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="col-start-3 col-end-4 row-start-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleArrowClick('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="col-start-2 row-start-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleArrowClick('down')}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
