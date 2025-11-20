import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Timer, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DailyActivity {
  id: string;
  activity_date: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  run_count: number;
  average_speed: number | null;
  max_speed: number | null;
  average_cadence: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_temp: number | null;
  calories: number | null;
  suffer_score: number | null;
  commute: boolean | null;
  trainer: boolean | null;
  photo_count: number | null;
  achievement_count: number | null;
  kudos_count: number | null;
  comment_count: number | null;
  device_names: any | null;
  workout_types: any | null;
  gear_ids: any | null;
}

interface RunnerActivitiesProps {
  runnerId: string;
}

export function RunnerActivities({ runnerId }: RunnerActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [extractingBestEffort, setExtractingBestEffort] = useState<string | null>(null);
  const [bestEffortDates, setBestEffortDates] = useState<Set<string>>(new Set());
  const [enrichedActivityDates, setEnrichedActivityDates] = useState<Set<string>>(new Set());
  const [individualActivities, setIndividualActivities] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('daily_activities')
          .select('*')
          .eq('runner_id', runnerId)
          .order('activity_date', { ascending: false })
          .limit(100);

        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);

        // Fetch best efforts to identify which activities have PRs
        const { data: bestEffortsData, error: bestEffortsError } = await supabase
          .from('best_efforts')
          .select('start_date')
          .eq('runner_id', runnerId);

        if (!bestEffortsError && bestEffortsData) {
          const dates = new Set(
            bestEffortsData
              .map(effort => effort.start_date?.split('T')[0])
              .filter(Boolean) as string[]
          );
          setBestEffortDates(dates);
        }

        // Fetch strava_activities to identify which activities have been enriched
        const { data: stravaActivitiesData, error: stravaActivitiesError } = await supabase
          .from('strava_activities')
          .select('activity_date, name')
          .eq('runner_id', runnerId)
          .not('name', 'is', null);

        if (!stravaActivitiesError && stravaActivitiesData) {
          const enrichedDates = new Set(
            stravaActivitiesData.map(act => act.activity_date)
          );
          setEnrichedActivityDates(enrichedDates);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [runnerId]);

  const toggleRow = (activityId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedRows(newExpanded);
  };

  const extractBestEffort = async (activityDate: string) => {
    setExtractingBestEffort(activityDate);
    try {
      // Fetch strava activities for this date first
      const { data: stravaActivities, error: fetchError } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('runner_id', runnerId)
        .eq('activity_date', activityDate);

      if (fetchError) throw fetchError;
      if (!stravaActivities || stravaActivities.length === 0) {
        throw new Error('No activities found for this date');
      }

      // Store the activities in state
      setIndividualActivities(prev => new Map(prev).set(activityDate, stravaActivities));

      // Process best efforts for the first activity
      const { data, error } = await supabase.functions.invoke('fetch-activity-best-efforts', {
        body: { strava_activity_id: stravaActivities[0].strava_activity_id, runner_id: runnerId }
      });

      if (error) throw error;

      // Refresh best efforts
      const { data: bestEffortsData } = await supabase
        .from('best_efforts')
        .select('start_date')
        .eq('runner_id', runnerId);

      if (bestEffortsData) {
        const dates = new Set(
          bestEffortsData
            .map(effort => effort.start_date?.split('T')[0])
            .filter(Boolean) as string[]
        );
        setBestEffortDates(dates);
      }

      toast.success(data?.message || 'Best efforts extracted successfully!');
    } catch (error: any) {
      console.error('Error extracting best efforts:', error);
      toast.error(error.message || 'Failed to extract best efforts');
    } finally {
      setExtractingBestEffort(null);
    }
  };

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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-2 w-8"></TableHead>
                <TableHead className="text-xs py-2">Date</TableHead>
                <TableHead className="text-xs py-2">Runs</TableHead>
                <TableHead className="text-xs py-2 text-right">Distance</TableHead>
                <TableHead className="text-xs py-2 text-right">Time</TableHead>
                <TableHead className="text-xs py-2 text-right">Elevation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const isExpanded = expandedRows.has(activity.id);
                const hasBestEffort = bestEffortDates.has(activity.activity_date);
                const isEnriched = enrichedActivityDates.has(activity.activity_date);
                
                return (
                  <>
                    <TableRow key={activity.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="py-2" onClick={() => toggleRow(activity.id)}>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm py-2 font-medium whitespace-nowrap" onClick={() => toggleRow(activity.id)}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const [year, month, day] = activity.activity_date.split('-');
                            const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return format(localDate, "MMM d, yy");
                          })()}
                          {hasBestEffort && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Contains personal best efforts</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {isEnriched && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Zap className="h-3.5 w-3.5 text-primary" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enriched with full Strava data</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-2" onClick={() => toggleRow(activity.id)}>
                        {activity.run_count}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {formatNumber(activity.distance)} mi
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {Math.floor(activity.moving_time / 60)}m
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {Math.round(activity.elevation_gain)}ft
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${activity.id}-expanded`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          {individualActivities.has(activity.activity_date) && individualActivities.get(activity.activity_date)!.length > 0 ? (
                            // Show individual activities fetched via Find Best Efforts
                            <div className="space-y-4">
                              {individualActivities.get(activity.activity_date)!.map((indivActivity) => (
                                <div key={indivActivity.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                                  {indivActivity.name && (
                                    <div className="font-semibold text-sm mb-2 text-foreground">{indivActivity.name}</div>
                                  )}
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Distance: </span>
                                      <span className="text-foreground">{formatNumber(indivActivity.distance)} mi</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Time: </span>
                                      <span className="text-foreground">{Math.floor(indivActivity.moving_time / 60)}m</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Elevation: </span>
                                      <span className="text-foreground">{Math.round(indivActivity.elevation_gain)}ft</span>
                                    </div>
                                    {indivActivity.average_speed && (
                                      <div>
                                        <span className="text-muted-foreground">Avg Pace: </span>
                                        <span className="text-foreground">{Math.floor(26.8224 / indivActivity.average_speed)}:{String(Math.round((26.8224 / indivActivity.average_speed % 1) * 60)).padStart(2, '0')}/mi</span>
                                      </div>
                                    )}
                                    {indivActivity.average_heartrate && (
                                      <div>
                                        <span className="text-muted-foreground">Avg HR: </span>
                                        <span className="text-foreground">{Math.round(indivActivity.average_heartrate)} bpm</span>
                                      </div>
                                    )}
                                    {indivActivity.average_cadence && (
                                      <div>
                                        <span className="text-muted-foreground">Avg Cadence: </span>
                                        <span className="text-foreground">{Math.round(indivActivity.average_cadence * 2)} spm</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Show aggregated data from daily_activities
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Total Distance: </span>
                                  <span className="text-foreground">{formatNumber(activity.distance)} mi</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total Time: </span>
                                  <span className="text-foreground">{Math.floor(activity.moving_time / 60)}m</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Elevation Gain: </span>
                                  <span className="text-foreground">{Math.round(activity.elevation_gain)}ft</span>
                                </div>
                                {activity.average_speed && (
                                  <div>
                                    <span className="text-muted-foreground">Avg Pace: </span>
                                    <span className="text-foreground">{Math.floor(26.8224 / activity.average_speed)}:{String(Math.round((26.8224 / activity.average_speed % 1) * 60)).padStart(2, '0')}/mi</span>
                                  </div>
                                )}
                                {activity.average_heartrate && (
                                  <div>
                                    <span className="text-muted-foreground">Avg HR: </span>
                                    <span className="text-foreground">{Math.round(activity.average_heartrate)} bpm</span>
                                  </div>
                                )}
                                {activity.average_cadence && (
                                  <div>
                                    <span className="text-muted-foreground">Avg Cadence: </span>
                                    <span className="text-foreground">{Math.round(activity.average_cadence * 2)} spm</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  extractBestEffort(activity.activity_date);
                                }}
                                disabled={extractingBestEffort === activity.activity_date}
                                variant="outline"
                                size="sm"
                                className="w-full md:w-auto gap-2"
                              >
                                <Timer className={`h-4 w-4 ${extractingBestEffort === activity.activity_date ? 'animate-spin' : ''}`} />
                                {extractingBestEffort === activity.activity_date ? "Finding Best Efforts..." : "Find Best Efforts"}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
