import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Loader2,
  Medal,
  Clock,
  RefreshCw,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/stores/useLanguage";

interface LeaderboardProps {
  getLeaderboard: (difficulty: string) => Promise<LeaderboardEntry[]>;
}

export function Leaderboard({ getLeaderboard }: LeaderboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

  // 선택된 날짜로 퍼즐 ID 접두사 생성
  const getDatePrefix = (date: Date) => {
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedDate) return;

      setLoading(true);
      setError("");

      try {
        // 선택한 날짜와 난이도에 따라 데이터 가져오기
        const data = await getLeaderboard(activeTab);

        // 날짜별 필터링은 클라이언트에서도 처리 (API에서 필터링이 제대로 안될 경우를 대비)
        const datePrefix = getDatePrefix(selectedDate);
        const filteredData = data.filter((entry) =>
          entry.puzzle_id.startsWith(`${datePrefix}-${activeTab}`),
        );

        setEntries(filteredData);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setError(t("Failed to load the leaderboard. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, selectedDate, getLeaderboard]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // 선택된 날짜가 오늘인지 확인
  const isToday = (date: Date | undefined): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getUTCFullYear() === today.getUTCFullYear() &&
      date.getUTCMonth() === today.getUTCMonth() &&
      date.getUTCDate() === today.getUTCDate()
    );
  };

  // 다음 재설정까지 남은 시간 계산
  const getRemainingTimeUntilReset = () => {
    // 선택된 날짜가 오늘인 경우에만 카운트다운 표시
    if (!selectedDate || !isToday(selectedDate)) {
      return (
        <div className="text-center text-sm">
          {t("Showing historical data for")}{" "}
          {selectedDate ? format(selectedDate, "PPP") : ""}
        </div>
      );
    }

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0); // 다음날 UTC 자정

    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div className="flex items-center justify-center gap-1">
        <RefreshCw className="h-3 w-3" />
        <span>
          {t("Resets in")} {diffHrs}h {diffMins}m
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{t('Leaderboard')}</CardTitle>
        <div className="flex items-center justify-center gap-2 text-center mt-1">
          <div className="text-muted-foreground text-sm">{t('Daily puzzle for')}</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 justify-start font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>{t('Pick a date')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <Tabs
        defaultValue="easy"
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "easy" | "medium" | "hard")
        }
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="easy">{t('Easy')}</TabsTrigger>
          <TabsTrigger value="medium">{t('Medium')}</TabsTrigger>
          <TabsTrigger value="hard">{t('Hard')}</TabsTrigger>
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
                {t('No records yet. Be the first to set a record!')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-1 w-10">#</th>
                      <th className="text-left py-2 px-1">{t('Nickname')}</th>
                      <th className="text-left py-2 px-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{t('Time')}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr
                        key={entry.id || index}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-2 px-1">
                          {index === 0 && (
                            <Medal className="h-5 w-5 text-yellow-500" />
                          )}
                          {index === 1 && (
                            <Medal className="h-5 w-5 text-gray-400" />
                          )}
                          {index === 2 && (
                            <Medal className="h-5 w-5 text-amber-700" />
                          )}
                          {index > 2 && index + 1}
                        </td>
                        <td className="py-2 px-1 font-medium">
                          {entry.nickname}
                        </td>
                        <td className="py-2 px-1">
                          {formatTime(entry.time_seconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-2 text-center text-sm text-muted-foreground border-t">
                  {isToday(selectedDate) ? (
                    <>
                      <div>{t('Leaderboard resets at midnight UTC')}</div>
                      <div>{getRemainingTimeUntilReset()}</div>
                    </>
                  ) : (
                    <div>{getRemainingTimeUntilReset()}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
