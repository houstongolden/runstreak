import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, TrendingUp, Clock, Mountain } from "lucide-react";
import { format } from "date-fns";

interface DailyActivity {
  id: string;
  activity_date: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  run_count: number;
}

interface RunnerActivitiesProps {
  runnerId: string;
}

export function RunnerActivities({ runnerId }: RunnerActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('daily_activities')
          .select('*')
          .eq('runner_id', runnerId)
          .order('activity_date', { ascending: false })
          .limit(100);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [runnerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No activities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(activity.activity_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.run_count} {activity.run_count === 1 ? 'run' : 'runs'}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formatNumber(activity.distance)} mi
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {Math.floor(activity.moving_time / 60)}m
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {Math.round(activity.elevation_gain)}ft
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
