import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Loader2 } from "lucide-react";
import { useSudoku } from "@/lib/stores/useSudoku";
import { useLanguage } from "@/lib/stores/useLanguage";
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
  board,
}: LeaderboardFormProps) {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError(t("Please enter a nickname."));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 보드의 내용을 기반으로 고유한 퍼즐 ID 생성
      const boardString = JSON.stringify(board);
      // 클라이언트 측에서는 간단한 해시 방식 사용
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // '2024-05-16'
      const puzzleId = `${dateStr}-${difficulty}`;

      const entry: LeaderboardEntry = {
        nickname: nickname.trim(),
        difficulty,
        time_seconds: elapsedSeconds,
        puzzle_id: puzzleId,
        board_snapshot: boardString,
      };

      await onSubmit(entry);
    } catch (err: any) {
      console.error("Leaderboard submission error:", err);
      
      // 서버로부터 받은 오류 메시지 처리
      if (err.response && err.response.data) {
        // 중복 제출 오류 처리
        if (err.response.status === 400 && err.response.data.error === "Duplicate submission") {
          setError(err.response.data.message || "You've already submitted a score for this difficulty level today.");
        } else {
          // 기타 서버 오류
          setError(err.response.data.message || "An error occurred while saving your score.");
        }
      } else {
        // 기타 네트워크 오류
        setError(t("An error occurred while saving your score. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">{t("Add to Leaderboard")}</h2>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {t("Congratulations! You've completed the")} {t(difficulty)} {t("puzzle in")}{" "}
        {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s. {t("Enter your nickname to save your score to the leaderboard.")}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          <Label htmlFor="nickname">{t("Nickname")}</Label>
          <Input
            id="nickname"
            placeholder={t("Enter your nickname")}
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
            {t("Skip")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
