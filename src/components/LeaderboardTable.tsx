import { Runner } from "@/types";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { MobileLeaderboardCard } from "./MobileLeaderboardCard";
import { RunnerStreakStatus } from "./RunnerStreakStatus";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeaderboardTableProps {
  runners: Runner[];
  view: "total" | "percent" | "fiveday";
}

export function LeaderboardTable({ runners, view }: LeaderboardTableProps) {
  const isMobile = useIsMobile();
  
  // Sort by current streak days descending
  const sortedRunners = [...runners].sort(
    (a, b) => b.current_streak_days - a.current_streak_days
  );

  // Calculate 5-day week streaks (simplified version using current streak as proxy for now)
  const fiveDayRunners = [...runners].sort(
    (a, b) => b.current_streak_days - a.current_streak_days
  );

  if (view === "fiveday") {
    if (isMobile) {
      return (
        <div className="space-y-3">
          {fiveDayRunners.map((runner, index) => (
            <MobileLeaderboardCard key={runner.id} runner={runner} rank={index} />
          ))}
        </div>
      );
    }

    return (
      <div className="rounded-lg border-0 bg-transparent backdrop-blur-0 overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/10 bg-muted/5">
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Runner</TableHead>
              <TableHead className="text-right">5-Day Weeks</TableHead>
              <TableHead className="text-right">Total Miles</TableHead>
              <TableHead className="text-right">Avg Miles/Day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fiveDayRunners.map((runner, index) => {
              const weeks = Math.floor(runner.current_streak_days / 7);
              return (
                <TableRow
                  key={runner.id}
                  className="hover:bg-orange-500/5 hover:backdrop-blur-md transition-all duration-200 cursor-pointer border-b border-border/10 bg-muted/0"
                >
                  <TableCell className="font-medium">
                    <Link to={`/runner/${runner.id}`} className="flex items-center gap-2">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/runner/${runner.id}`} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={runner.avatar_url || undefined} />
                        <AvatarFallback>
                          {runner.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{runner.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{runner.strava_username}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/runner/${runner.id}`}>
                      <Badge variant="secondary" className="gap-1.5 font-semibold">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {weeks} weeks
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Link to={`/runner/${runner.id}`}>
                      {runner.current_streak_miles.toFixed(1)} mi
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <Link to={`/runner/${runner.id}`}>
                      {runner.average_miles_per_day.toFixed(2)} mi/day
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedRunners.map((runner, index) => (
          <MobileLeaderboardCard key={runner.id} runner={runner} rank={index} />
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="rounded-lg border-0 bg-transparent backdrop-blur-0 overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/10 bg-muted/5">
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Runner</TableHead>
            <TableHead className="text-right">Streak Days</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Total Miles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRunners.map((runner, index) => (
            <TableRow
              key={runner.id}
              className="hover:bg-orange-500/5 hover:backdrop-blur-md transition-all duration-200 cursor-pointer border-b border-border/10 bg-muted/0"
            >
              <TableCell className="font-medium">
                <Link to={`/runner/${runner.id}`} className="flex items-center gap-2">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/runner/${runner.id}`} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={runner.avatar_url || undefined} />
                    <AvatarFallback>
                      {runner.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{runner.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      @{runner.strava_username}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/runner/${runner.id}`}>
                  <div className="flex items-center justify-end gap-2">
                    <Flame className="h-6 w-6 text-orange-500 drop-shadow-[0_0_8px_rgba(255,69,0,0.5)]" />
                    <span className="text-2xl font-semibold">{runner.current_streak_days}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <RunnerStreakStatus 
                  lastActivityDate={runner.last_activity_date}
                  timezone={runner.timezone || 'America/Los_Angeles'}
                  country={runner.country}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                <Link to={`/runner/${runner.id}`}>
                  {runner.current_streak_days > 0 
                    ? `${runner.current_streak_miles.toFixed(1)} mi` 
                    : `${runner.ytd_distance.toFixed(1)} mi (YTD)`}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
