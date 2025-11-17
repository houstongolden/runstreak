import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AggregateStats {
  total_users: number;
  avg_days_on_streak_improvement: number;
  avg_days_on_streak_percentage: number;
  active_streaks_count: number;
}

export function AggregateStatsCard() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("aggregate_stats")
        .select("*")
        .order("stat_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If no aggregate stats exist yet, calculate from runners
      if (!data) {
        const { data: runners, error: runnersError } = await supabase
          .from("runners")
          .select("days_on_streak_since_joining, total_days_since_joining, days_on_streak_before_joining, total_days_before_joining, streak_status");

        if (runnersError) throw runnersError;

        if (runners && runners.length > 0) {
          let totalImprovement = 0;
          let totalPercentage = 0;
          let validCount = 0;

          runners.forEach(runner => {
            if (runner.total_days_since_joining > 0) {
              const percentageSince = (runner.days_on_streak_since_joining / runner.total_days_since_joining) * 100;
              const percentageBefore = runner.total_days_before_joining > 0
                ? (runner.days_on_streak_before_joining / runner.total_days_before_joining) * 100
                : 0;
              
              if (percentageBefore > 0) {
                totalImprovement += (percentageSince - percentageBefore);
                validCount++;
              }
              totalPercentage += percentageSince;
            }
          });

          setStats({
            total_users: runners.length,
            avg_days_on_streak_improvement: validCount > 0 ? totalImprovement / validCount : 0,
            avg_days_on_streak_percentage: runners.length > 0 ? totalPercentage / runners.length : 0,
            active_streaks_count: runners.filter(r => r.streak_status === 'active').length,
          });
        }
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching aggregate stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-48 w-full" />
        </div>
      </section>
    );
  }

  if (!stats || stats.total_users === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-12 xl:px-16 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            RunStreak Impact
          </h2>
          <p className="text-muted-foreground">
            Real results from our running community
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-primary">
                  {stats.avg_days_on_streak_improvement > 0 ? '+' : ''}
                  {stats.avg_days_on_streak_improvement.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Average improvement in days on streak after joining
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Flame className="h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-foreground">
                  {stats.avg_days_on_streak_percentage.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Average days on streak rate among all users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Users className="h-8 w-8 text-primary" />
                <div className="text-3xl font-bold text-foreground">
                  {stats.total_users}
                </div>
                <p className="text-sm text-muted-foreground">
                  Runners building consistency
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
