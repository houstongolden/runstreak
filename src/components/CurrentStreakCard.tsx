import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, Award, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

interface CurrentStreakCardProps {
  streakDays: number;
  streakMiles: number;
  streakStatus: string | null;
  avgMilesPerDay: number;
}

export function CurrentStreakCard({
  streakDays,
  streakMiles,
  streakStatus,
  avgMilesPerDay,
}: CurrentStreakCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Flame className="h-5 w-5" />
          Current Streak
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your active running streak and performance metrics
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Days - Most Prominent */}
          <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              Streak Days
            </div>
            <div className="text-4xl font-bold text-primary">
              {streakDays}
            </div>
            <p className="text-xs text-muted-foreground">
              {streakDays === 1 ? "day" : "days"} in a row
            </p>
          </div>

          {/* Streak Miles */}
          <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Streak Miles
            </div>
            <div className="text-4xl font-bold">
              {formatNumber(streakMiles)}
            </div>
            <p className="text-xs text-muted-foreground">
              total distance
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              Status
            </div>
            <div className="text-4xl font-bold capitalize">
              {streakStatus || "active"}
            </div>
            <p className="text-xs text-muted-foreground">
              current state
            </p>
          </div>

          {/* Avg Daily Miles */}
          <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Avg Daily
            </div>
            <div className="text-4xl font-bold">
              {formatNumber(avgMilesPerDay)}
            </div>
            <p className="text-xs text-muted-foreground">
              miles per day
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
