import * as schema from "@shared/schema";
import { type User, type InsertUser, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // 리더보드 관련 메서드
  getLeaderboard(difficulty: string, limit?: number): Promise<Leaderboard[]>;
  saveScore(score: InsertLeaderboard): Promise<Leaderboard>;
}

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
  
  async getLeaderboard(difficulty: string, limit: number = 10): Promise<Leaderboard[]> {
    return this.leaderboards
      .filter(entry => entry.difficulty === difficulty)
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
}

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
  
  async getLeaderboard(difficulty: string, limit: number = 10): Promise<Leaderboard[]> {
    return await db
      .select()
      .from(schema.leaderboard)
      .where(eq(schema.leaderboard.difficulty, difficulty))
      .orderBy(desc(schema.leaderboard.time_seconds))
      .limit(limit);
  }
  
  async saveScore(score: InsertLeaderboard): Promise<Leaderboard> {
    const result = await db
      .insert(schema.leaderboard)
      .values(score)
      .returning();
    return result[0];
  }
}

// 메모리 스토리지 사용 (나중에 DB로 전환할 수 있음)
export const storage = new MemStorage();
