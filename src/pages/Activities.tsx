import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistance, formatDuration } from "@/lib/formatters";
import { Calendar, MapPin, TrendingUp, Clock, Timer, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DailyActivity {
  id: string;
  activity_date: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  run_count: number;
  runner_id: string;
  has_best_efforts?: boolean;
}

export default function Activities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);
  const [enrichingActivity, setEnrichingActivity] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: runnersData } = await supabase
        .from('runners')
        .select('id')
        .limit(1)
        .single();

      if (!runnersData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('runner_id', runnersData.id)
        .order('activity_date', { ascending: false });

      if (error) throw error;

      // Check which activities have best efforts extracted
      const activitiesWithBadges = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: bestEfforts } = await supabase
            .from('best_efforts')
            .select('id')
            .eq('runner_id', activity.runner_id)
            .eq('is_estimated', false)
            .gte('start_date', activity.activity_date)
            .lt('start_date', new Date(new Date(activity.activity_date).getTime() + 86400000).toISOString().split('T')[0])
            .limit(1);

          return {
            ...activity,
            has_best_efforts: (bestEfforts?.length || 0) > 0,
          };
        })
      );

      setActivities(activitiesWithBadges);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindBestEfforts = async (activity: DailyActivity, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card collapse
    setEnrichingActivity(activity.id);
    
    try {
      const { error } = await supabase.functions.invoke('fetch-activity-best-efforts', {
        body: { 
          runnerId: activity.runner_id,
          activityDate: activity.activity_date
        }
      });

      if (error) throw error;

      toast({
        title: "Activity enriched",
        description: "Best efforts have been found and updated for this activity.",
      });

      // Refresh activities to show updated data
      await fetchActivities();
    } catch (error) {
      console.error('Error enriching activity:', error);
      toast({
        title: "Error",
        description: "Failed to enrich activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrichingActivity(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No activities found. Connect your Strava account to see your activities.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-instrument font-medium mb-2">Activities</h1>
        <p className="text-muted-foreground">
          {activities.length} days of activity tracked
        </p>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card
            key={activity.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {format(new Date(activity.activity_date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  {activity.has_best_efforts && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Trophy className="h-4 w-4 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Best efforts extracted</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.run_count} run{activity.run_count !== 1 ? 's' : ''}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="font-semibold">{formatDistance(activity.distance)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-semibold">{formatDuration(activity.moving_time)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Elevation</div>
                    <div className="font-semibold">{Math.round(activity.elevation_gain)} ft</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Pace</div>
                    <div className="font-semibold">
                      {activity.distance > 0
                        ? `${Math.floor(activity.moving_time / 60 / (activity.distance / 1609.34))}'${Math.round((activity.moving_time / 60 / (activity.distance / 1609.34) % 1) * 60)}"`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedActivity?.id === activity.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Distance</div>
                      <div className="font-medium">{(activity.distance / 1609.34).toFixed(2)} miles</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Time</div>
                      <div className="font-medium">{formatDuration(activity.moving_time)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Elevation Gain</div>
                      <div className="font-medium">{Math.round(activity.elevation_gain)} feet</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Number of Runs</div>
                      <div className="font-medium">{activity.run_count}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={(e) => handleFindBestEfforts(activity, e)}
                    disabled={enrichingActivity === activity.id}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Timer className="mr-2 h-4 w-4" />
                    {enrichingActivity === activity.id ? "Finding Best Efforts..." : "Find Best Efforts"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
