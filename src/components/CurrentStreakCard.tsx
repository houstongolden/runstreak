import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, Award, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

interface CurrentStreakCardProps {
  streakDays: number;
  streakMiles: number;
  streakStatus: string | null;
  avgMilesPerDay: number;
  streakStartDate: string | null;
  lastActivityDate: string | null;
}

export function CurrentStreakCard({
  streakDays,
  streakMiles,
  streakStatus,
  avgMilesPerDay,
  streakStartDate,
  lastActivityDate,
}: CurrentStreakCardProps) {
  // Format date range for current streak
  const formatDateRange = () => {
    if (!streakStartDate) return null;
    
    const startDate = new Date(streakStartDate);
    const endDate = lastActivityDate ? new Date(lastActivityDate) : new Date();
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
    };
    
    const startStr = startDate.toLocaleDateString('en-US', formatOptions);
    const endStr = endDate.toLocaleDateString('en-US', formatOptions);
    
    if (startStr === endStr) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  };

  const dateRange = formatDateRange();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-primary text-base">
          <Flame className="h-4 w-4" />
          Current Streak
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Days in a row running 1+ mile per day
        </p>
      </CardHeader>
      <CardContent className="overflow-hidden pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Streak Days - Most Prominent */}
          <div className="space-y-1 p-2.5 rounded-lg bg-background/50 border border-primary/10 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="truncate">Streak Days</span>
            </div>
            <div className="text-2xl font-bold text-primary break-words">
              {streakDays}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {streakDays === 1 ? "day" : "days"} in a row
            </p>
            {dateRange && (
              <p className="text-[10px] text-muted-foreground">
                {dateRange}
              </p>
            )}
          </div>

          {/* Streak Miles */}
          <div className="space-y-1 p-2.5 rounded-lg bg-background/50 border border-primary/10 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Streak Miles</span>
            </div>
            <div className="text-2xl font-bold break-words">
              {formatNumber(streakMiles)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              total distance
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1 p-2.5 rounded-lg bg-background/50 border border-primary/10 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Status</span>
            </div>
            <div className="text-2xl font-bold capitalize break-words">
              {streakStatus || "active"}
            </div>
            <p className="text-[10px] text-muted-foreground">
              current state
            </p>
          </div>

          {/* Avg Daily Miles */}
          <div className="space-y-1 p-2.5 rounded-lg bg-background/50 border border-primary/10 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Avg Daily</span>
            </div>
            <div className="text-2xl font-bold break-words">
              {formatNumber(avgMilesPerDay)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              miles per day
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
