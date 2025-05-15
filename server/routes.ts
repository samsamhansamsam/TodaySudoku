import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "../shared/schema";
import { eq, and, like } from "drizzle-orm";
import { parseISO, isValid } from "date-fns"; // 상단에 추가 필요

export async function registerRoutes(app: Express): Promise<Server> {
  // 리더보드 엔드포인트

  // 특정 난이도의 리더보드 가져오기
  app.get(
    "/api/leaderboard/:difficulty",
    async (req: Request, res: Response) => {
      try {
        const { difficulty } = req.params;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : 10;
        const dateParam = req.query.date as string | undefined;

        if (!["easy", "medium", "hard"].includes(difficulty)) {
          return res.status(400).json({
            error:
              "Invalid difficulty level. Must be 'easy', 'medium', or 'hard'",
          });
        }

        // 날짜 지정이 있으면 사용하고, 없으면 오늘 날짜 사용
        const today = new Date().toISOString().split("T")[0];
        const targetDate =
          dateParam && isValid(parseISO(dateParam)) ? dateParam : today;

        // ✅ storage.getLeaderboard 호출로 교체
        const leaderboard = await storage.getLeaderboard({
          difficulty,
          limit,
          date: targetDate,
        });

        res.json(leaderboard);
      } catch (error) {
        console.error(`Error processing leaderboard request:`, error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  );

  // 새로운 점수 등록하기
  app.post("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      console.log("Received leaderboard entry:", req.body);

      const parseResult = insertLeaderboardSchema.safeParse(req.body);

      if (!parseResult.success) {
        console.error("Validation failed:", parseResult.error.errors);
        return res.status(400).json({
          error: "Invalid request body",
          details: parseResult.error.errors,
        });
      }

      console.log("Validation successful, data:", parseResult.data);

      // 유저 IP 가져오기
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lastSixDigits = ip.replace(/[^0-9]/g, "").slice(-6) || "000000";

      // 퍼즐 ID에서 날짜 부분 추출 (형식: YYYY-MM-DD-difficulty-hash)
      const puzzleIdParts = parseResult.data.puzzle_id.split('-');
      const dateStr = puzzleIdParts.slice(0, 3).join('-'); // YYYY-MM-DD
      const difficulty = parseResult.data.difficulty;

      // 이미 오늘 해당 난이도의 퍼즐을 제출했는지 확인
      const duplicates = await storage.checkDuplicateSubmission(ip, dateStr, difficulty);
      
      if (duplicates.length > 0) {
        console.log(`Duplicate submission detected for IP: ${ip}, Date: ${dateStr}, Difficulty: ${difficulty}`);
        return res.status(400).json({
          error: "Duplicate submission",
          message: "You have already submitted a score for this difficulty level today."
        });
      }
      
      // IP 주소 저장 (DB 저장용)
      parseResult.data.ip_address = ip;

      // 닉네임 뒤에 IP 추가 (표시용)
      if (lastSixDigits !== "000000") {
        parseResult.data.nickname = `${parseResult.data.nickname} #${lastSixDigits}`;
      }

      console.log("Saving score with nickname:", parseResult.data.nickname);
      const entry = await storage.saveScore(parseResult.data);
      console.log("Entry saved successfully:", entry);

      res.status(201).json(entry);
    } catch (error) {
      console.error(`Error saving score:`, error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
