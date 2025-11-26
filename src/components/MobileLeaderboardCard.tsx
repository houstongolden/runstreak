import { Runner } from "@/types";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-primary">{runner.current_streak_days || 0}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <Badge variant={runner.streak_status === "active" ? "default" : "secondary"} className="gap-1.5">
            {runner.streak_status === "active" ? (
              <>
                <Flame className="h-3 w-3" />
                Streak Active ✓
              </>
            ) : (
              "Streak Broken"
            )}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
