import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Medal, Clock } from "lucide-react";

interface LeaderboardProps {
  getLeaderboard: (difficulty: string) => Promise<LeaderboardEntry[]>;
}

export function Leaderboard({ getLeaderboard }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"easy" | "medium" | "hard">("easy");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");
      
      try {
        const data = await getLeaderboard(activeTab);
        setEntries(data);
      } catch (err) {
        console.error("리더보드 불러오기 실패:", err);
        setError("리더보드를 불러오는데 실패했습니다. 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [activeTab, getLeaderboard]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">리더보드</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue="easy" value={activeTab} onValueChange={(value) => setActiveTab(value as "easy" | "medium" | "hard")}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="easy">쉬움</TabsTrigger>
          <TabsTrigger value="medium">보통</TabsTrigger>
          <TabsTrigger value="hard">어려움</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : entries.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1 w-10">#</th>
                      <th className="text-left py-2 px-1">닉네임</th>
                      <th className="text-left py-2 px-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>시간</span>
                        </div>
                      </th>
                      <th className="text-left py-2 px-1 hidden md:table-cell">날짜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.id || index} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-1">
                          {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
                          {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                          {index === 2 && <Medal className="h-5 w-5 text-amber-700" />}
                          {index > 2 && index + 1}
                        </td>
                        <td className="py-2 px-1 font-medium">{entry.nickname}</td>
                        <td className="py-2 px-1">{formatTime(entry.time_seconds)}</td>
                        <td className="py-2 px-1 hidden md:table-cell text-muted-foreground">
                          {formatDate(entry.completed_at as unknown as string)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}