import { Button } from "@/components/ui/button";
import { Pencil, Eraser } from "lucide-react";
import { useEffect } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { useLanguage } from "@/lib/stores/useLanguage";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

type ControlsProps = { showOnlyNumbers?: boolean };
export default function Controls({ showOnlyNumbers = false }: ControlsProps) {
  const { t } = useLanguage();
  const {
    selectedCell,
    setSelectedCell,
    setCellValue,
    isNoteMode,
    toggleNoteMode,
    clearCell,
    originalBoard,
    toggleNote,
    board,
  } = useSudoku();

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

      // 퍼즐이 이미 완료되었는지 확인
      const { hasWon } = useSudoku.getState();
      if (hasWon) return; // 완료된 경우 입력 처리하지 않음

      // Number keys
      if (/^[1-9]$/.test(e.key)) {
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
            setSelectedCell({
              row: selectedCell.row,
              col: selectedCell.col - 1,
            });
          }
          break;
        case "ArrowRight":
          if (selectedCell.col < 8) {
            setSelectedCell({
              row: selectedCell.row,
              col: selectedCell.col + 1,
            });
          }
          break;
        case "ArrowUp":
          if (selectedCell.row > 0) {
            setSelectedCell({
              row: selectedCell.row - 1,
              col: selectedCell.col,
            });
          }
          break;
        case "ArrowDown":
          if (selectedCell.row < 8) {
            setSelectedCell({
              row: selectedCell.row + 1,
              col: selectedCell.col,
            });
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

    // 퍼즐이 이미 완료되었는지 확인
    const { hasWon } = useSudoku.getState();
    if (hasWon) return; // 완료된 경우 입력 처리하지 않음

    if (isNoteMode) {
      toggleNote(selectedCell.row, selectedCell.col, num);
    } else {
      setCellValue(selectedCell.row, selectedCell.col, num);
    }
  };

  // Navigation is now handled through direct touch/click on cells

  // Check if selected cell is an original cell (provided at start)
  const isOriginalCell = selectedCell
    ? originalBoard[selectedCell.row][selectedCell.col] !== 0
    : false;

  return (
    <div className="w-full max-w-md">
      {/* Number buttons - 항상 가로 배열로 유지 */}
      <div className="grid grid-cols-9 gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          // Check if the number has been placed 9 times (maximum for Sudoku)
          const isFullyPlaced = numberCounts[num] >= 9;

          return (
            <Button
              key={num}
              variant="outline"
              className={cn(
                "text-lg font-medium relative py-2",
                // 모바일에서는 높이만 높이고 가로는 유지
                isMobile ? "h-10" : "aspect-square",
                isFullyPlaced ? "opacity-30" : "",
              )}
              onClick={() => handleNumberClick(num)}
              disabled={
                !selectedCell ||
                isOriginalCell ||
                isFullyPlaced ||
                useSudoku.getState().hasWon
              }
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

      {/* 2) showOnlyNumbers === false 일 때만 메모·지우개 */}
      {!showOnlyNumbers && (
        <div className="flex justify-center gap-2 mb-4">
          {/* 메모 토글 */}
          <Button
            variant={isNoteMode ? "default" : "outline"}
            className={cn("gap-1", isMobile ? "h-12 px-3" : "")}
            onClick={toggleNoteMode}
            disabled={!selectedCell || isOriginalCell}
          >
            <Pencil className={cn("h-4 w-4", isMobile ? "h-5 w-5" : "")} />
            <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>
              {t("Notes")}
            </span>
          </Button>

          {/* 지우개 */}
          <Button
            variant="outline"
            className={cn("gap-1", isMobile ? "h-12 px-3" : "")}
            onClick={() =>
              selectedCell && clearCell(selectedCell.row, selectedCell.col)
            }
            disabled={!selectedCell || isOriginalCell}
          >
            <Eraser className={cn("h-4 w-4", isMobile ? "h-5 w-5" : "")} />
            <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>
              {t("Clear")}
            </span>
          </Button>
        </div>
      )}

      {/* Control buttons */}
      {/* <div className="flex justify-center gap-2 mb-4">
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
          <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>{t('Notes')}</span>
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
          <span className={cn(isMobile ? "hidden sm:inline-block" : "")}>{t('Clear')}</span>
        </Button>
      </div> */}
    </div>
  );
}
