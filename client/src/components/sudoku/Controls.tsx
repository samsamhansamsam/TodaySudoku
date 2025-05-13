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
    toggleNote
  } = useSudoku();
  
  const { playHit } = useAudio();
  const isMobile = useIsMobile();

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

  const isOriginalCell = selectedCell && originalBoard[selectedCell.row][selectedCell.col] !== 0;

  return (
    <div className="w-full max-w-md">
      {/* Number buttons */}
      <div className="grid grid-cols-9 gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className={cn(
              "aspect-square text-lg font-medium",
              isMobile ? "h-10 w-10" : ""
            )}
            onClick={() => handleNumberClick(num)}
            disabled={!selectedCell || isOriginalCell}
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={isNoteMode ? "default" : "outline"}
          className="gap-1"
          onClick={toggleNoteMode}
          disabled={!selectedCell || isOriginalCell}
        >
          <Pencil className="h-4 w-4" />
          <span className={cn(isMobile ? "hidden" : "")}>Notes</span>
        </Button>
        
        <Button
          variant="outline"
          className="gap-1"
          onClick={() => selectedCell && clearCell(selectedCell.row, selectedCell.col)}
          disabled={!selectedCell || isOriginalCell}
        >
          <Eraser className="h-4 w-4" />
          <span className={cn(isMobile ? "hidden" : "")}>Erase</span>
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
