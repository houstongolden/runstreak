import { Runner } from "@/types";
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

interface LeaderboardTableProps {
  runners: Runner[];
  view: "total" | "percent";
}

export function LeaderboardTable({ runners, view }: LeaderboardTableProps) {
  // Sort by current streak days descending
  const sortedRunners = [...runners].sort(
    (a, b) => b.current_streak_days - a.current_streak_days
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Runner</TableHead>
            <TableHead className="text-right">Streak Days</TableHead>
            <TableHead className="text-right">Total Miles</TableHead>
            <TableHead className="text-right">Avg Miles/Day</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRunners.map((runner, index) => (
            <TableRow
              key={runner.id}
              className="hover:bg-muted/50 transition-colors"
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
                <Badge variant="secondary" className="gap-1.5 font-semibold">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {runner.current_streak_days} days
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {runner.current_streak_miles.toFixed(1)} mi
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {runner.average_miles_per_day.toFixed(1)} mi
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
