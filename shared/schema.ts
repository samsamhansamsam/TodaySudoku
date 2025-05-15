import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// 리더보드를 위한 테이블
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull(), // easy, medium, hard
  time_seconds: integer("time_seconds").notNull(), // 완료 시간(초)
  puzzle_id: varchar("puzzle_id", { length: 100 }).notNull(), // 퍼즐의 고유 ID (보드의 해시값)
  board_snapshot: text("board_snapshot").notNull(), // 완성된 보드의 JSON 스냅샷
  completed_at: timestamp("completed_at").defaultNow().notNull(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  nickname: true,
  difficulty: true,
  time_seconds: true,
  puzzle_id: true,
  board_snapshot: true,
  completed_at: true,
});

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
