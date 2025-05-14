import { useEffect, useState, useRef } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import SudokuBoard from "./SudokuBoard";
import Controls from "./Controls";
import Timer from "./Timer";
import { LeaderboardForm } from "./LeaderboardForm"; 
import { Leaderboard } from "./Leaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Info, Check, RefreshCw, Volume2, VolumeX, Trophy, HelpCircle } from "lucide-react";
import { useAudio } from "@/lib/stores/useAudio";
import { LeaderboardEntry, saveLeaderboardEntry, getLeaderboard } from "@/lib/queryClient";

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
    resetTimer
  } = useSudoku();
  
  // 로컬 스토리지에서 게임 시작 상태 복원
  const [isGameStarted, setIsGameStarted] = useState(() => {
    try {
      // localStorage와 sessionStorage에서 확인
      const storageData = localStorage.getItem('sudoku-storage') || sessionStorage.getItem('sudoku-storage');
      if (storageData) {
        const storedState = JSON.parse(storageData);
        // 저장된 상태가 있고 게임이 시작되었다면 true 반환
        if (storedState.state && storedState.state.board && storedState.state.board.length > 0) {
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

  // Initialize audio
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute, isMuted } = useAudio();
  
  useEffect(() => {
    // Setup audio elements
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    const hitSfx = new Audio("/sounds/hit.mp3");
    const successSfx = new Audio("/sounds/success.mp3");
    
    setBackgroundMusic(bgMusic);
    setHitSound(hitSfx);
    setSuccessSound(successSfx);
    
    // Clean up on unmount
    return () => {
      stopTimer();
    };
  }, []);
  
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
      setShowLeaderboardForm(true);
    }
  }, [hasWon, stopTimer]);

  const handleNewGame = () => {
    generateNewGame(difficulty);
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
    setDifficulty(diff as "easy" | "medium" | "hard");
  };

  return (
    <div className="w-full max-w-4xl px-4 py-8">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Sudoku Puzzle</CardTitle>
              <CardDescription>Fill in the grid with numbers from 1-9</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Timer seconds={elapsedSeconds} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isGameStarted ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to Sudoku!</h2>
                <p className="text-muted-foreground">Select a difficulty and start a new game</p>
              </div>
              
              <div className="flex items-center gap-2 w-full max-w-md justify-center mb-2">
                <h3 className="text-sm font-medium">Select Difficulty</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Difficulty info</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <p><strong>Easy:</strong> 40/81 cells filled - For beginners, straightforward solving techniques.</p>
                        <p><strong>Medium:</strong> 30/81 cells filled - Requires more deduction and moderate techniques.</p>
                        <p><strong>Hard:</strong> 20/81 cells filled - Challenging puzzles requiring advanced techniques.</p>
                        <p className="text-xs italic mt-2">All puzzles have a unique solution that can be solved logically.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Tabs defaultValue="easy" className="w-full max-w-md" onValueChange={selectDifficulty}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="easy">Easy</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="hard">Hard</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button size="lg" onClick={handleNewGame}>
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
                          setShowLeaderboardForm(false);
                          setShowLeaderboard(true);
                        } catch (error) {
                          console.error("Error saving score:", error);
                        }
                      }}
                      onSkip={() => {
                        setShowLeaderboardForm(false);
                        setShowGameOver(false);
                      }}
                      difficulty={difficulty}
                      elapsedSeconds={elapsedSeconds}
                      board={currentBoard}
                    />
                  </CardContent>
                )}
                
                {showLeaderboard && (
                  <CardContent>
                    <Leaderboard getLeaderboard={(difficulty) => getLeaderboard(difficulty)} />
                  </CardContent>
                )}
                
                <CardFooter className="flex justify-center gap-4">
                  {!showLeaderboardForm && (
                    <>
                      <Button variant="outline" onClick={() => setShowGameOver(false)}>
                        Continue
                      </Button>
                      <Button onClick={handleNewGame}>
                        New Game
                      </Button>
                      {hasWon && !showLeaderboard && (
                        <Button variant="secondary" onClick={() => setShowLeaderboard(true)}>
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
          <CardFooter className="flex flex-wrap justify-center gap-3 pt-2">
            <Button variant="outline" onClick={handleCheckSolution}>
              <Check className="mr-2 h-4 w-4" /> Check Solution
            </Button>
            <Button variant="outline" onClick={handleResetGame}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Board
            </Button>
            <Button onClick={handleNewGame}>
              New Game
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
