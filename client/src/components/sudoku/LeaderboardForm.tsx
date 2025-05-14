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
      setError("닉네임을 입력해주세요.");
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
      console.error("리더보드 제출 오류:", err);
      setError("점수 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">리더보드에 기록하기</h2>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        축하합니다! {difficulty} 난이도의 퍼즐을 {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초에 완료하셨습니다.
        리더보드에 기록을 남기고 싶으시다면 닉네임을 입력해주세요.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            placeholder="닉네임을 입력하세요"
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
            건너뛰기
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            제출하기
          </Button>
        </div>
      </form>
    </div>
  );
}