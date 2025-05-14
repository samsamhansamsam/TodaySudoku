import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Loader2 } from "lucide-react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { LeaderboardEntry } from "@/lib/queryClient";
import { createHash } from "crypto";

interface LeaderboardFormProps {
  onSubmit: (entry: LeaderboardEntry) => Promise<void>;
  onSkip: () => void;
  difficulty: "easy" | "medium" | "hard";
  elapsedSeconds: number;
  board: number[][];
}

export function LeaderboardForm({ 
  onSubmit, 
  onSkip, 
  difficulty, 
  elapsedSeconds, 
  board 
}: LeaderboardFormProps) {
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // 보드의 내용을 기반으로 고유한 퍼즐 ID 생성
      const boardString = JSON.stringify(board);
      // 클라이언트 측에서는 간단한 해시 방식 사용
      const puzzleId = Array.from(boardString)
        .reduce((hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) | 0, 0)
        .toString();
      
      const entry: LeaderboardEntry = {
        nickname: nickname.trim(),
        difficulty,
        time_seconds: elapsedSeconds,
        puzzle_id: puzzleId,
        board_snapshot: boardString
      };
      
      await onSubmit(entry);
    } catch (err) {
      console.error("Leaderboard submission error:", err);
      setError("An error occurred while saving your score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Add to Leaderboard</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Congratulations! You've completed the {difficulty} puzzle in {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s.
        Enter your nickname to save your score to the leaderboard.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            disabled={isSubmitting}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}