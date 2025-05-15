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
    // 정확한 날짜 매칭을 위해 YYYY-MM-DD 포맷 확인
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      console.error("Invalid date format provided:", date);
      return [];
    }
    
    // 완전히 정확한 날짜 매칭을 위해 puzzle_id가 'YYYY-MM-DD-difficulty'로 시작하는 항목 필터링
    const puzzleIdPrefix = `${date}-${difficulty}`;
    console.log(`[MemStorage] Filtering leaderboard with prefix: ${puzzleIdPrefix}`);
    
    const result = this.leaderboards
      .filter(
        (entry) =>
          entry.difficulty === difficulty &&
          entry.puzzle_id.startsWith(puzzleIdPrefix),
      )
      .sort((a, b) => a.time_seconds - b.time_seconds)
      .slice(0, limit);
      
    console.log(`[MemStorage] Found ${result.length} entries for ${puzzleIdPrefix}`);
    return result;
  }

  async saveScore(score: InsertLeaderboard): Promise<Leaderboard> {
    const id = this.currentLeaderboardId++;
    const completed_at = score.completed_at || new Date();
    
    // ip_address가 null이 될 수 있도록 타입 처리
    const entry: Leaderboard = {
      ...score,
      id,
      completed_at,
      ip_address: score.ip_address || null
    };
    
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
    // 정확한 날짜 매칭을 위해 YYYY-MM-DD 포맷 확인
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      console.error("Invalid date format provided:", date);
      return [];
    }
    
    // 완전히 정확한 날짜 매칭을 위해 puzzle_id가 'YYYY-MM-DD-difficulty-'로 시작하는 항목 필터링
    const puzzleIdPrefix = `${date}-${difficulty}`;
    
    console.log(`Filtering leaderboard with prefix: ${puzzleIdPrefix}`);
    
    const results = await db
      .select()
      .from(schema.leaderboard)
      .where(
        and(
          eq(schema.leaderboard.difficulty, difficulty),
          // 정확한 날짜 매칭을 위해 like에 날짜-난이도 패턴 사용
          like(schema.leaderboard.puzzle_id, `${puzzleIdPrefix}%`),
        ),
      )
      .orderBy(schema.leaderboard.time_seconds)
      .limit(limit);
      
    console.log(`Found ${results.length} entries for ${puzzleIdPrefix}`);
    return results;
  }

  async saveScore(score: InsertLeaderboard): Promise<Leaderboard> {
    // completed_at이 제공되지 않았다면 현재 시간으로 설정
    if (!score.completed_at) {
      score.completed_at = new Date();
    }
    
    // ip_address가 null이 될 수 있도록 타입 처리
    const scoreToInsert = {
      ...score,
      ip_address: score.ip_address || null
    };
    
    const result = await db
      .insert(schema.leaderboard)
      .values(scoreToInsert)
      .returning();
    return result[0];
  }

  async checkDuplicateSubmission(ip: string, dateStr: string, difficulty: string): Promise<Leaderboard[]> {
    const puzzleIdPrefix = `${dateStr}-${difficulty}`;
    const results = await db
      .select()
      .from(schema.leaderboard)
      .where(
        and(
          eq(schema.leaderboard.difficulty, difficulty),
          like(schema.leaderboard.puzzle_id, `${puzzleIdPrefix}%`),
          eq(schema.leaderboard.ip_address, ip)
        )
      );
    return results;
  }
}

// 👉 여기만 바꾸면 메모리 vs DB 선택 가능
export const storage: IStorage = new DbStorage();
// export const storage: IStorage = new MemStorage();
