import { useEffect, useState, useRef, useCallback } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import SudokuBoard from "./SudokuBoard";
import Controls from "./Controls";
import Timer from "./Timer";
import { LeaderboardForm } from "./LeaderboardForm";
import { Leaderboard } from "./Leaderboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Info,
  Check,
  RefreshCw,
  Trophy,
  HelpCircle,
} from "lucide-react";
import {
  LeaderboardEntry,
  saveLeaderboardEntry,
  getLeaderboard,
} from "@/lib/queryClient";
import {
  isDifficultyCompleted,
  markDifficultyCompleted,
  resetCompletedPuzzles,
} from "@/lib/sudoku/generator";

export default function SudokuGame() {
  const {
    generateNewGame,
    checkSolution,
    resetGame,
    isComplete,
    hasWon,
    difficulty,
    setDifficulty,
    elapsedSeconds,
    startTimer,
    stopTimer,
    resetTimer,
  } = useSudoku();

  // 로컬 스토리지에서 게임 시작 상태 복원
  const [isGameStarted, setIsGameStarted] = useState(() => {
    try {
      // localStorage와 sessionStorage에서 확인
      const storageData =
        localStorage.getItem("sudoku-storage") ||
        sessionStorage.getItem("sudoku-storage");
      if (storageData) {
        const storedState = JSON.parse(storageData);
        // 저장된 상태가 있고 게임이 시작되었다면 true 반환
        if (
          storedState.state &&
          storedState.state.board &&
          storedState.state.board.length > 0
        ) {
          return true;
        }
      }
    } catch (e) {
      console.error("Error loading game state:", e);
    }
    return false;
  });
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLeaderboardForm, setShowLeaderboardForm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<number[][]>([[]]);
  // 사용자가 선택한 난이도 추적
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  // 연습 모드 상태 추가
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // 컴포넌트 언마운트 시 정리 작업
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시에만 타이머 정지
      stopTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 키보드 단축키 처리 함수 추가
  useEffect(() => {
    // 시크릿 단축키: Alt+R (로컬 스토리지 초기화), Alt+L (리더보드 완료 기록 초기화)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+R 단축키로 로컬 스토리지 초기화
      if (e.altKey && e.key === "r") {
        // 로컬 스토리지 및 세션 스토리지 초기화
        try {
          localStorage.removeItem("sudoku-storage");
          sessionStorage.removeItem("sudoku-storage");
          console.log("Storage cleared! Reload the page to start fresh.");
          alert("Storage cleared! The page will now reload.");
          window.location.reload();
        } catch (err) {
          console.error("Error clearing storage:", err);
        }
      }

      // Alt+L 단축키로 오늘의 리더보드 완료 기록 초기화
      if (e.altKey && e.key === "l") {
        try {
          resetCompletedPuzzles();
          console.log("Leaderboard completion status reset for today!");
          alert(
            "Leaderboard completion status has been reset for today. You can now submit scores for all difficulties again.",
          );
        } catch (err) {
          console.error("Error resetting leaderboard completion status:", err);
        }
      }
    };

    // 키보드 이벤트 리스너 등록
    window.addEventListener("keydown", handleKeyDown);

    // 클린업 함수
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 타이머 시작 - 참조용 변수 추가하여 타이머 중복 시작 방지
  useEffect(() => {
    // 이미 타이머가 실행 중인지 확인하기 위한 참조
    const timerState = useSudoku.getState().timerInterval;

    // 게임이 시작된 상태이고 타이머가 실행 중이 아닐 때만 시작
    if (isGameStarted && timerState === null) {
      startTimer();
    }

    return () => {
      // 이 효과가 다시 실행될 때는 타이머를 중지하지 않음
      // 컴포넌트가 언마운트될 때만 타이머 중지(위의 오디오 효과에서 처리)
    };
  }, [isGameStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // 보드 상태 추적
  useEffect(() => {
    // useSudoku 스토어의 board 값을 현재 컴포넌트 상태로 가져오기
    const state = useSudoku.getState();
    setCurrentBoard([...state.board]);
  }, [isComplete]); // 게임 완료시 최종 보드 상태 저장

  useEffect(() => {
    if (hasWon) {
      stopTimer();
      setShowGameOver(true);
      
      // 연습 모드인 경우 리더보드 제출 폼을 표시하지 않음
      if (isPracticeMode) {
        setShowLeaderboardForm(false);
        
        // 연습 모드 완료 메시지 표시
        setTimeout(() => {
          alert(`Practice mode completed! Your time: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`);
        }, 100);
      } else {
        // 일반 모드에서는 리더보드 제출 폼 표시
        setShowLeaderboardForm(true);
        
        // 난이도 완료 표시
        markDifficultyCompleted(difficulty);
      }
    }
  }, [hasWon, stopTimer, isPracticeMode, difficulty, elapsedSeconds]);

  const handleNewGame = () => {
    // 선택한 난이도가 없으면 실행하지 않음
    if (!selectedDifficulty) return;
    
    // 선택한 난이도 적용
    const currentDifficulty = selectedDifficulty as "easy" | "medium" | "hard";
    setDifficulty(currentDifficulty);
    setIsPracticeMode(false); // 기본적으로 연습 모드 아님
    
    // 1. 이 난이도가 이미 완료된 경우 연습 모드 플레이 또는 리더보드 선택
    if (isDifficultyCompleted(currentDifficulty)) {
      // 이미 완료된 난이도인 경우 사용자에게 확인
      const playPractice = window.confirm(
        `You've already completed today's ${currentDifficulty} puzzle. Would you like to play it again in practice mode? (리더보드 등록은 불가능합니다)`
      );
      
      if (playPractice) {
        // 연습 모드로 게임 시작
        generateNewGame(currentDifficulty);
        resetTimer();
        startTimer();
        setIsGameStarted(true);
        setShowGameOver(false);
        setShowLeaderboardForm(false);
        setShowLeaderboard(false);
        setIsPracticeMode(true); // 연습 모드로 설정
      } else {
        // 리더보드 보기
        generateNewGame(currentDifficulty); // 오늘의 퍼즐 로드
        setIsGameStarted(true);
        setShowGameOver(true);
        setShowLeaderboardForm(false);
        setShowLeaderboard(true);
      }
      return;
    }

    // 2. 새 게임 시작 (처음 플레이하는 경우)
    generateNewGame(currentDifficulty);
    resetTimer();
    startTimer();
    setIsGameStarted(true);
    setShowGameOver(false);
    setShowLeaderboardForm(false);
    setShowLeaderboard(false);
  };

  const handleCheckSolution = () => {
    checkSolution();
  };

  const handleResetGame = () => {
    resetGame();
  };

  const selectDifficulty = (diff: string) => {
    setSelectedDifficulty(diff);
  };

  const memoizedGetLeaderboard = useCallback(
    (difficulty: string) => {
      return getLeaderboard(difficulty as "easy" | "medium" | "hard");
    },
    [],
  );

  return (
    <div className="w-full max-w-4xl px-4 py-8">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-row justify-between items-center gap-2">
            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold">Sudoku Puzzle</CardTitle>
              {isPracticeMode && (
                <span className="text-xs text-amber-600 font-medium mt-1">
                  Practice Mode (scores will not be saved)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Timer seconds={elapsedSeconds} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isGameStarted ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to Sudoku!
                </h2>
                <p className="text-muted-foreground">
                  Select a difficulty and start a new game
                </p>
              </div>

              <div className="flex items-center gap-2 w-full max-w-md justify-center mb-2">
                <h3 className="text-sm font-medium">Select Difficulty</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Difficulty info</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Easy:</strong> 50/81 cells filled - For
                          beginners, straightforward solving techniques.
                        </p>
                        <p>
                          <strong>Medium:</strong> 35/81 cells filled - Requires
                          more deduction and moderate techniques.
                        </p>
                        <p>
                          <strong>Hard:</strong> 20/81 cells filled -
                          Challenging puzzles requiring advanced techniques.
                        </p>
                        <p className="text-xs italic mt-2">
                          All puzzles have a unique solution that can be solved
                          logically.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Tabs
                className="w-full max-w-md"
                onValueChange={selectDifficulty}
                value={selectedDifficulty || undefined}
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="easy">Easy</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="hard">Hard</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button 
                size="lg" 
                onClick={handleNewGame} 
                disabled={!selectedDifficulty}
              >
                Start New Game
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info size={16} />
                <span>Choose difficulty and press Start to begin!</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-square mb-4">
                <SudokuBoard />
              </div>

              <Controls />
            </div>
          )}

          {showGameOver && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle className="text-center">
                    {hasWon ? "Congratulations!" : "Game Over!"}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {hasWon
                      ? `You've completed the ${difficulty} puzzle in ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s!`
                      : "The puzzle is still incomplete or has errors."}
                  </CardDescription>
                </CardHeader>

                {showLeaderboardForm && hasWon && (
                  <CardContent>
                    <LeaderboardForm
                      onSubmit={async (entry) => {
                        try {
                          await saveLeaderboardEntry(entry);

                          // 레더보드에 등록된 난이도를 완료 처리 (하루에 한 번만 등록 가능)
                          markDifficultyCompleted(difficulty);

                          setShowLeaderboardForm(false);
                          setShowLeaderboard(true);
                        } catch (error) {
                          console.error("Error saving score:", error);
                        }
                      }}
                      onSkip={() => {
                        // Skip 버튼 클릭 시 메인 페이지로 이동
                        setShowLeaderboardForm(false);
                        setShowGameOver(false);
                        setIsGameStarted(false); // 메인 페이지로 이동
                        resetTimer();
                      }}
                      difficulty={difficulty}
                      elapsedSeconds={elapsedSeconds}
                      board={currentBoard}
                    />
                  </CardContent>
                )}

                {showLeaderboard && (
                  <CardContent>
                    <Leaderboard getLeaderboard={memoizedGetLeaderboard} />
                  </CardContent>
                )}

                <CardFooter className="flex justify-center gap-4">
                  {!showLeaderboardForm && (
                    <>
                      {/* 리더보드가 보이는 경우 Continue 버튼 제거 */}
                      {!showLeaderboard && (
                        <Button
                          variant="outline"
                          onClick={() => setShowGameOver(false)}
                        >
                          Continue
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          // New Game 버튼은 리더보드에서 메인 페이지로 이동
                          if (showLeaderboard) {
                            setIsGameStarted(false);
                            setShowGameOver(false);
                            setShowLeaderboard(false);
                            resetTimer();
                          } else {
                            handleNewGame();
                          }
                        }}
                      >
                        {showLeaderboard ? "Back to Main" : "New Game"}
                      </Button>
                      {hasWon && !showLeaderboard && (
                        <Button
                          variant="secondary"
                          onClick={() => setShowLeaderboard(true)}
                        >
                          <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </CardContent>

        {isGameStarted && (
          <CardFooter className="flex justify-center flex-wrap gap-4 pt-2">
            <Button variant="outline" onClick={handleCheckSolution}>
              <Check className="mr-2 h-4 w-4" /> Check Solution
            </Button>
            <Button variant="outline" onClick={handleResetGame}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Board
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                // 메인 페이지로 돌아가기
                setIsGameStarted(false);
                resetTimer();
              }}
            >
              Back to Main
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
