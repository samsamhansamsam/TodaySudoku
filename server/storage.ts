import * as schema from "@shared/schema";
import {
  type User,
  type InsertUser,
  type Leaderboard,
  type InsertLeaderboard,
} from "@shared/schema";
import { eq, and, like } from "drizzle-orm";
import { db } from "./db";

// 스토리지 인터페이스 정의
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // 날짜 기반 유연 필터링을 위한 시그니처
  getLeaderboard(params: {
    difficulty: string;
    limit?: number;
    date: string;
  }): Promise<Leaderboard[]>;

  saveScore(score: InsertLeaderboard): Promise<Leaderboard>;
  
  // 중복 제출 확인 (같은 IP, 날짜, 난이도 조합)
  checkDuplicateSubmission(ip: string, dateStr: string, difficulty: string): Promise<Leaderboard[]>;
}

// ---------- 메모리 스토리지 ---------- //
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leaderboards: Leaderboard[];
  currentId: number;
  currentLeaderboardId: number;

  constructor() {
    this.users = new Map();
    this.leaderboards = [];
    this.currentId = 1;
    this.currentLeaderboardId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLeaderboard({
    difficulty,
    limit = 10,
    date,
  }: {
    difficulty: string;
    limit?: number;
    date: string;
  }): Promise<Leaderboard[]> {
    const puzzleIdPrefix = `${date}-${difficulty}`;
    return this.leaderboards
      .filter(
        (entry) =>
          entry.difficulty === difficulty &&
          entry.puzzle_id.startsWith(puzzleIdPrefix),
      )
      .sort((a, b) => a.time_seconds - b.time_seconds)
      .slice(0, limit);
  }

  async saveScore(score: InsertLeaderboard): Promise<Leaderboard> {
    const id = this.currentLeaderboardId++;
    const completed_at = new Date();
    const entry = { ...score, id, completed_at };
    this.leaderboards.push(entry);
    return entry;
  }
  
  async checkDuplicateSubmission(ip: string, dateStr: string, difficulty: string): Promise<Leaderboard[]> {
    const puzzleIdPrefix = `${dateStr}-${difficulty}`;
    return this.leaderboards.filter(
      (entry) => 
        entry.difficulty === difficulty && 
        entry.puzzle_id.startsWith(puzzleIdPrefix) &&
        entry.ip_address === ip
    );
  }
}

// ---------- 실제 DB 스토리지 ---------- //
export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db
      .insert(schema.users)
      .values(user)
      .returning({ id: schema.users.id });
    const userId = result[0].id;
    return { ...user, id: userId };
  }

  async getLeaderboard({
    difficulty,
    limit = 10,
    date,
  }: {
    difficulty: string;
    limit?: number;
    date: string;
  }): Promise<Leaderboard[]> {
    const puzzleIdPrefix = `${date}-${difficulty}`;
    const results = await db
      .select()
      .from(schema.leaderboard)
      .where(
        and(
          eq(schema.leaderboard.difficulty, difficulty),
          like(schema.leaderboard.puzzle_id, `${puzzleIdPrefix}%`),
        ),
      )
      .orderBy(schema.leaderboard.time_seconds)
      .limit(limit);
    return results;
  }

  async saveScore(score: InsertLeaderboard): Promise<Leaderboard> {
    const result = await db
      .insert(schema.leaderboard)
      .values(score)
      .returning();
    return result[0];
  }
}

// 👉 여기만 바꾸면 메모리 vs DB 선택 가능
export const storage: IStorage = new DbStorage();
// export const storage: IStorage = new MemStorage();
