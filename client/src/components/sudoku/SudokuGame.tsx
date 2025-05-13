import { useEffect, useRef, useState } from "react";
import { useSudoku } from "@/lib/stores/useSudoku";
import SudokuBoard from "./SudokuBoard";
import Controls from "./Controls";
import Timer from "./Timer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Info, Check, RefreshCw } from "lucide-react";
import { useAudio } from "@/lib/stores/useAudio";
import { setupKaboom } from "@/lib/kaboom/setup";

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // Initialize audio
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute } = useAudio();
  
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
  
  // Setup Kaboom whenever the canvas ref changes
  useEffect(() => {
    if (canvasRef.current && isGameStarted) {
      console.log("Setting up Kaboom with canvas");
      setupKaboom(canvasRef.current);
    }
  }, [canvasRef, isGameStarted]);
  
  useEffect(() => {
    if (hasWon) {
      stopTimer();
      setShowGameOver(true);
    }
  }, [hasWon]);

  const handleNewGame = () => {
    generateNewGame(difficulty);
    resetTimer();
    startTimer();
    setIsGameStarted(true);
    setShowGameOver(false);
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
            <Timer seconds={elapsedSeconds} />
          </div>
        </CardHeader>

        <CardContent>
          {!isGameStarted ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to Sudoku!</h2>
                <p className="text-muted-foreground">Select a difficulty and start a new game</p>
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
                <canvas ref={canvasRef} className="w-full h-full absolute inset-0" />
                {isGameStarted && <SudokuBoard />}
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
                <CardFooter className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setShowGameOver(false)}>
                    Continue
                  </Button>
                  <Button onClick={handleNewGame}>
                    New Game
                  </Button>
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
