import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Medal, Clock, RefreshCw } from "lucide-react";

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
        console.error("Failed to load leaderboard:", err);
        setError("Failed to load the leaderboard. Please try again.");
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
  
  // 다음 재설정까지 남은 시간 계산
  const getRemainingTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0); // 다음날 UTC 자정
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return (
      <div className="flex items-center justify-center gap-1">
        <RefreshCw className="h-3 w-3" />
        <span>Resets in {diffHrs}h {diffMins}m</span>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Leaderboard</CardTitle>
        <div className="text-center text-muted-foreground text-sm mt-1">
          Daily puzzle for {new Date().toLocaleDateString()}
        </div>
      </CardHeader>
      
      <Tabs defaultValue="easy" value={activeTab} onValueChange={(value) => setActiveTab(value as "easy" | "medium" | "hard")}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="easy">Easy</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="hard">Hard</TabsTrigger>
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
                No records yet. Be the first to set a record!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1 w-10">#</th>
                      <th className="text-left py-2 px-1">Nickname</th>
                      <th className="text-left py-2 px-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Time</span>
                        </div>
                      </th>

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

                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-2 text-center text-sm text-muted-foreground border-t">
                  <div>Leaderboard resets at midnight UTC</div>
                  <div>{getRemainingTimeUntilReset()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}