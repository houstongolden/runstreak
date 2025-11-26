import { Runner } from "@/types";
import { useNavigate } from "react-router-dom";
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
  sortBy?: "streak" | "miles" | "pace";
}

export function LeaderboardTable({ runners, view, sortBy = "streak" }: LeaderboardTableProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Runners are already sorted from parent, use as-is
  const sortedRunners = runners;

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
            <TableHead className="text-right">Days</TableHead>
            <TableHead className="text-right">Streak Status</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {fiveDayRunners.map((runner, index) => {
              const streakActive = runner.streak_status === "active";
              return (
                <TableRow
                  key={runner.id}
                  onClick={() => navigate(`/runner/${runner.id}`)}
                  className="hover:bg-orange-500/5 hover:backdrop-blur-md transition-all duration-200 cursor-pointer border-b border-border/10 bg-muted/0"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
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
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-lg font-bold text-primary">{runner.current_streak_days || 0}</span>
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={streakActive ? "default" : "secondary"} className="gap-1.5">
                      {streakActive ? (
                        <>
                          <Flame className="h-4 w-4" />
                          Streak Active ✓
                        </>
                      ) : (
                        "Streak Broken"
                      )}
                    </Badge>
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
            <TableHead className="text-right">Days</TableHead>
            <TableHead className="text-right">Streak Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRunners.map((runner, index) => {
            const streakActive = runner.streak_status === "active";
            return (
              <TableRow
                key={runner.id}
                onClick={() => navigate(`/runner/${runner.id}`)}
                className="hover:bg-orange-500/5 hover:backdrop-blur-md transition-all duration-200 cursor-pointer border-b border-border/10 bg-muted/0"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                    {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
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
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-lg font-bold text-primary">{runner.current_streak_days || 0}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={streakActive ? "default" : "secondary"} className="gap-1.5">
                    {streakActive ? (
                      <>
                        <Flame className="h-4 w-4" />
                        Streak Active ✓
                      </>
                    ) : (
                      "Streak Broken"
                    )}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
