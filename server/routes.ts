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

      // 유저 IP 뒤 6자리 가져오기
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const lastSixDigits = ip.replace(/[^0-9]/g, "").slice(-6) || "000000";

      // 닉네임 뒤에 IP 추가 (있는 경우)
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
