import { QueryClient, QueryFunction } from "@tanstack/react-query";

// 리더보드 관련 API 인터페이스
export interface LeaderboardEntry {
  id?: number;
  nickname: string;
  difficulty: "easy" | "medium" | "hard";
  time_seconds: number;
  puzzle_id: string;
  board_snapshot: string;
  completed_at?: Date;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// 리더보드 API 함수
export async function saveLeaderboardEntry(data: LeaderboardEntry) {
  console.log("Saving leaderboard entry:", data);
  try {
    const response = await apiRequest("POST", "/api/leaderboard", data);
    const result = await response.json();
    console.log("Leaderboard entry saved successfully:", result);
    return result;
  } catch (err) {
    console.error("Error saving leaderboard entry:", err);
    throw err;
  }
}

export async function getLeaderboard(difficulty: string, limit = 10, date?: Date) {
  // 날짜가 제공되지 않으면 현재 날짜 사용
  const selectedDate = date || new Date();
  
  // ISO 형식으로 날짜를 변환 (YYYY-MM-DD)
  const dateStr = `${selectedDate.getUTCFullYear()}-${String(selectedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(selectedDate.getUTCDate()).padStart(2, '0')}`;
  
  // 쿼리 파라미터를 포함한 URL 구성
  const url = `/api/leaderboard/${difficulty}?limit=${limit}&date=${dateStr}`;
  
  console.log(`Fetching leaderboard for ${difficulty} difficulty on ${dateStr}`);
  
  try {
    const response = await apiRequest("GET", url);
    const data = await response.json();
    console.log(`Received ${data.length} leaderboard entries`);
    return data;
  } catch (error) {
    console.error(`Error fetching leaderboard: ${error}`);
    throw error;
  }
}
