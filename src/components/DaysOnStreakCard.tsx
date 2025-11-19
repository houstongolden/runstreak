import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DaysOnStreakCardProps {
  daysOnStreak30: number;
  daysOnStreak60: number;
  daysOnStreak90: number;
  daysOnStreakSinceJoining: number;
  totalDaysSinceJoining: number;
  daysOnStreakBeforeJoining: number;
  totalDaysBeforeJoining: number;
  joinedAt?: string | null;
}

export function DaysOnStreakCard({
  daysOnStreak30,
  daysOnStreak60,
  daysOnStreak90,
  daysOnStreakSinceJoining,
  totalDaysSinceJoining,
  daysOnStreakBeforeJoining,
  totalDaysBeforeJoining,
  joinedAt,
}: DaysOnStreakCardProps) {
  const percentage30 = ((daysOnStreak30 / 30) * 100).toFixed(1);
  const percentage60 = ((daysOnStreak60 / 60) * 100).toFixed(1);
  const percentage90 = ((daysOnStreak90 / 90) * 100).toFixed(1);
  
  const percentageSinceJoining = totalDaysSinceJoining > 0
    ? ((daysOnStreakSinceJoining / totalDaysSinceJoining) * 100).toFixed(1)
    : "0.0";

  const percentageBeforeJoining = totalDaysBeforeJoining > 0
    ? ((daysOnStreakBeforeJoining / totalDaysBeforeJoining) * 100).toFixed(1)
    : "0.0";

  const improvement = totalDaysBeforeJoining > 0 && totalDaysSinceJoining > 0
    ? (parseFloat(percentageSinceJoining) - parseFloat(percentageBeforeJoining)).toFixed(1)
    : null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-primary text-base">
          <Flame className="h-4 w-4" />
          Days on Streak
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Your consistency matters more than perfection. We celebrate every day you show up.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Since Joining - Most Prominent */}
        {totalDaysSinceJoining > 0 && (
          <div className="space-y-2 p-2.5 rounded-lg bg-background/50 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Since Joining RunStreaks</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-primary">
                    {daysOnStreakSinceJoining}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {totalDaysSinceJoining} days
                  </span>
                </div>
              </div>
              <Badge variant="default" className="text-xs px-2 py-1">
                {percentageSinceJoining}%
              </Badge>
            </div>
            <Progress value={parseFloat(percentageSinceJoining)} className="h-2" />
            
            {improvement !== null && (
              <div className="flex items-center gap-1.5 pt-1">
                {parseFloat(improvement) > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] text-green-500 font-semibold">
                      +{improvement}% improvement since joining
                    </span>
                  </>
                ) : parseFloat(improvement) < 0 ? (
                  <span className="text-[10px] text-muted-foreground">
                    Keep going! You're building consistency.
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Maintaining your baseline consistency
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Periods */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">Recent Activity</p>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last 30 Days</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {daysOnStreak30}/30
                </span>
                <Badge variant="outline" className="min-w-[50px] text-[10px]">
                  {percentage30}%
                </Badge>
              </div>
            </div>
            <Progress value={parseFloat(percentage30)} className="h-2" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last 60 Days</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {daysOnStreak60}/60
                </span>
                <Badge variant="outline" className="min-w-[50px] text-[10px]">
                  {percentage60}%
                </Badge>
              </div>
            </div>
            <Progress value={parseFloat(percentage60)} className="h-2" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last 90 Days</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {daysOnStreak90}/90
                </span>
                <Badge variant="outline" className="min-w-[50px] text-[10px]">
                  {percentage90}%
                </Badge>
              </div>
            </div>
            <Progress value={parseFloat(percentage90)} className="h-2" />
          </div>
        </div>

        {joinedAt && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-2 border-t">
            <Calendar className="h-3 w-3" />
            Joined RunStreaks on {new Date(joinedAt).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
