import { Runner } from "@/types";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame } from "lucide-react";
import { RunnerStreakStatus } from "./RunnerStreakStatus";

interface MobileLeaderboardCardProps {
  runner: Runner;
  rank: number;
}

export function MobileLeaderboardCard({ runner, rank }: MobileLeaderboardCardProps) {
  const getRankDisplay = () => {
    if (rank === 0) return <span className="text-2xl">🥇</span>;
    if (rank === 1) return <span className="text-2xl">🥈</span>;
    if (rank === 2) return <span className="text-2xl">🥉</span>;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank + 1}</span>;
  };

  return (
    <Link to={`/runner/${runner.id}`} className="block border-b border-border hover:bg-muted/30 transition-colors">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0 w-8 flex items-center justify-center">
            {getRankDisplay()}
          </div>
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={runner.avatar_url || undefined} />
            <AvatarFallback>
              {runner.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{runner.display_name}</div>
            <div className="text-xs text-muted-foreground truncate">
              @{runner.strava_username}
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <RunnerStreakStatus 
            lastActivityDate={runner.last_activity_date}
            timezone={runner.timezone || 'America/Los_Angeles'}
            country={runner.country}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <div className="text-sm font-semibold">{runner.current_streak_days}d</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {runner.current_streak_days > 0 ? "Total" : "YTD Miles"}
            </div>
            <div className="text-sm font-semibold">
              {runner.current_streak_days > 0 
                ? runner.current_streak_miles.toFixed(1) 
                : runner.ytd_distance.toFixed(1)}mi
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {runner.current_streak_days > 0 ? "Avg/Day" : "YTD Avg"}
            </div>
            <div className="text-sm font-semibold">
              {runner.current_streak_days > 0 
                ? runner.average_miles_per_day.toFixed(1)
                : (runner.ytd_distance / Math.max(new Date().getDate(), 1)).toFixed(1)}mi
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
