import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Calendar, TrendingUp, Trophy } from "lucide-react";
import { format } from "date-fns";

interface Streak {
  id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  total_miles: number;
  average_miles_per_day: number;
  total_runs: number;
}

interface StreakHistoryProps {
  runnerId: string;
}

export function StreakHistory({ runnerId }: StreakHistoryProps) {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreaks();
  }, [runnerId]);

  const fetchStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from("streak_history")
        .select("*")
        .eq("runner_id", runnerId)
        .order("days_count", { ascending: false });

      if (error) throw error;
      setStreaks(data || []);
    } catch (error) {
      console.error("Error fetching streak history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Streak History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (streaks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Streak History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No streaks recorded yet. Keep running for 5+ consecutive days to start building your streak history!
          </p>
        </CardContent>
      </Card>
    );
  }

  const topStreak = streaks[0];
  const longestMileStreak = [...streaks].sort((a, b) => b.total_miles - a.total_miles)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Streak History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Achievements */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Longest Streak</p>
                  <p className="text-2xl font-bold text-primary">{topStreak.days_count} days</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(topStreak.start_date), "MMM d, yyyy")} - {format(new Date(topStreak.end_date), "MMM d, yyyy")}
                  </p>
                </div>
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Most Miles in a Streak</p>
                  <p className="text-2xl font-bold text-foreground">{longestMileStreak.total_miles.toFixed(1)} mi</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {longestMileStreak.days_count} days ({longestMileStreak.average_miles_per_day.toFixed(1)} mi/day)
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Streaks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">All Streaks</h3>
          {streaks.map((streak, index) => (
            <Card key={streak.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        <Flame className="h-3 w-3 mr-1" />
                        {streak.days_count} days
                      </Badge>
                      <Badge variant="outline">
                        {streak.total_runs} runs
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(streak.start_date), "MMM d, yyyy")} - {format(new Date(streak.end_date), "MMM d, yyyy")}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Distance</p>
                        <p className="text-sm font-semibold">{streak.total_miles.toFixed(1)} miles</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg per Day</p>
                        <p className="text-sm font-semibold">{streak.average_miles_per_day.toFixed(1)} mi/day</p>
                      </div>
                    </div>
                  </div>
                  {index === 0 && (
                    <Trophy className="h-6 w-6 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
