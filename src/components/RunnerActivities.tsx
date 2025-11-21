import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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

interface StravaActivity {
  id: string;
  strava_activity_id: number;
  activity_date: string;
  name: string | null;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  type: string | null;
  sport_type: string | null;
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
  manual: boolean | null;
  photo_count: number | null;
  achievement_count: number | null;
  kudos_count: number | null;
  comment_count: number | null;
  device_name: string | null;
  workout_type: string | null;
  gear_id: string | null;
  pr_count: number | null;
}

interface RunnerActivitiesProps {
  runnerId: string;
}

export function RunnerActivities({ runnerId }: RunnerActivitiesProps) {
  const { runnerId: currentUserRunnerId } = useAuth();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [extractingBestEffort, setExtractingBestEffort] = useState<string | null>(null);
  const [bestEffortIds, setBestEffortIds] = useState<Set<number>>(new Set());
  
  const isOwnProfile = currentUserRunnerId === runnerId;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch individual strava activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('strava_activities')
          .select('*')
          .eq('runner_id', runnerId)
          .order('activity_date', { ascending: false })
          .limit(200);

        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);

        // Fetch best efforts to identify which activities have PRs
        const { data: bestEffortsData, error: bestEffortsError } = await supabase
          .from('best_efforts')
          .select('strava_activity_id')
          .eq('runner_id', runnerId)
          .not('strava_activity_id', 'is', null);

        if (!bestEffortsError && bestEffortsData) {
          const ids = new Set(
            bestEffortsData
              .map(effort => effort.strava_activity_id)
              .filter(Boolean) as number[]
          );
          setBestEffortIds(ids);
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

  const extractBestEffort = async (activityId: string, stravaActivityId: number) => {
    setExtractingBestEffort(activityId);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-activity-best-efforts', {
        body: { strava_activity_id: stravaActivityId, runner_id: runnerId }
      });

      if (error) throw error;

      // Refresh best efforts
      const { data: bestEffortsData } = await supabase
        .from('best_efforts')
        .select('strava_activity_id')
        .eq('runner_id', runnerId)
        .not('strava_activity_id', 'is', null);

      if (bestEffortsData) {
        const ids = new Set(
          bestEffortsData
            .map(effort => effort.strava_activity_id)
            .filter(Boolean) as number[]
        );
        setBestEffortIds(ids);
      }

      if (data?.updated_count && data.updated_count > 0) {
        toast.success(`Found ${data.updated_count} new best effort${data.updated_count > 1 ? 's' : ''}!`);
      } else {
        toast.success('Activity scanned (no new best efforts found)');
      }
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
                <TableHead className="text-xs py-2">Name</TableHead>
                <TableHead className="text-xs py-2 text-right">Distance</TableHead>
                <TableHead className="text-xs py-2 text-right">Time</TableHead>
                <TableHead className="text-xs py-2 text-right">Elevation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const isExpanded = expandedRows.has(activity.id);
                const hasBestEffort = bestEffortIds.has(activity.strava_activity_id);
                
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
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-2 max-w-[200px] truncate" onClick={() => toggleRow(activity.id)}>
                        {activity.name || 'Unnamed Activity'}
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
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Type: </span>
                                <span className="text-foreground">{activity.sport_type || activity.type || 'Run'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Distance: </span>
                                <span className="text-foreground">{formatNumber(activity.distance)} mi</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Moving Time: </span>
                                <span className="text-foreground">{Math.floor(activity.moving_time / 60)}m</span>
                              </div>
                              {activity.elapsed_time && (
                                <div>
                                  <span className="text-muted-foreground">Elapsed Time: </span>
                                  <span className="text-foreground">{Math.floor(activity.elapsed_time / 60)}m</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Elevation: </span>
                                <span className="text-foreground">{Math.round(activity.elevation_gain)}ft</span>
                              </div>
                              {activity.average_speed && (
                                <div>
                                  <span className="text-muted-foreground">Avg Pace: </span>
                                  <span className="text-foreground font-semibold">{Math.floor(26.8224 / activity.average_speed)}:{String(Math.round((26.8224 / activity.average_speed % 1) * 60)).padStart(2, '0')}/mi</span>
                                </div>
                              )}
                              {activity.max_speed && (
                                <div>
                                  <span className="text-muted-foreground">Max Pace: </span>
                                  <span className="text-foreground">{Math.floor(26.8224 / activity.max_speed)}:{String(Math.round((26.8224 / activity.max_speed % 1) * 60)).padStart(2, '0')}/mi</span>
                                </div>
                              )}
                              {activity.average_heartrate && (
                                <div>
                                  <span className="text-muted-foreground">Avg HR: </span>
                                  <span className="text-foreground">{Math.round(activity.average_heartrate)} bpm</span>
                                </div>
                              )}
                              {activity.max_heartrate && (
                                <div>
                                  <span className="text-muted-foreground">Max HR: </span>
                                  <span className="text-foreground">{Math.round(activity.max_heartrate)} bpm</span>
                                </div>
                              )}
                              {activity.average_cadence && (
                                <div>
                                  <span className="text-muted-foreground">Avg Cadence: </span>
                                  <span className="text-foreground">{Math.round(activity.average_cadence * 2)} spm</span>
                                </div>
                              )}
                              {activity.calories && (
                                <div>
                                  <span className="text-muted-foreground">Calories: </span>
                                  <span className="text-foreground">{Math.round(activity.calories)}</span>
                                </div>
                              )}
                              {activity.suffer_score && (
                                <div>
                                  <span className="text-muted-foreground">Suffer Score: </span>
                                  <span className="text-foreground">{activity.suffer_score}</span>
                                </div>
                              )}
                              {activity.average_temp !== null && activity.average_temp !== undefined && (
                                <div>
                                  <span className="text-muted-foreground">Temperature: </span>
                                  <span className="text-foreground">{Math.round(activity.average_temp * 9/5 + 32)}°F</span>
                                </div>
                              )}
                              {activity.device_name && (
                                <div>
                                  <span className="text-muted-foreground">Device: </span>
                                  <span className="text-foreground">{activity.device_name}</span>
                                </div>
                              )}
                              {activity.workout_type && (
                                <div>
                                  <span className="text-muted-foreground">Workout Type: </span>
                                  <span className="text-foreground">{activity.workout_type}</span>
                                </div>
                              )}
                              {activity.trainer && (
                                <div>
                                  <span className="text-muted-foreground">Type: </span>
                                  <Badge variant="secondary" className="text-xs">Treadmill</Badge>
                                </div>
                              )}
                              {activity.commute && (
                                <div>
                                  <span className="text-muted-foreground">Type: </span>
                                  <Badge variant="secondary" className="text-xs">Commute</Badge>
                                </div>
                              )}
                              {activity.manual && (
                                <div>
                                  <span className="text-muted-foreground">Source: </span>
                                  <Badge variant="outline" className="text-xs">Manual Entry</Badge>
                                </div>
                              )}
                              {activity.achievement_count && activity.achievement_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Achievements: </span>
                                  <span className="text-foreground">{activity.achievement_count}</span>
                                </div>
                              )}
                              {activity.kudos_count && activity.kudos_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Kudos: </span>
                                  <span className="text-foreground">{activity.kudos_count}</span>
                                </div>
                              )}
                              {activity.comment_count && activity.comment_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Comments: </span>
                                  <span className="text-foreground">{activity.comment_count}</span>
                                </div>
                              )}
                              {activity.photo_count && activity.photo_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Photos: </span>
                                  <span className="text-foreground">{activity.photo_count}</span>
                                </div>
                              )}
                              {activity.pr_count && activity.pr_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">PRs: </span>
                                  <Badge variant="default" className="text-xs">{activity.pr_count} Personal Records</Badge>
                                </div>
                              )}
                            </div>
                            {isOwnProfile && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  extractBestEffort(activity.id, activity.strava_activity_id);
                                }}
                                disabled={extractingBestEffort === activity.id}
                                variant="outline"
                                size="sm"
                                className="mt-4 w-full md:w-auto gap-2"
                              >
                                <Timer className={`h-4 w-4 ${extractingBestEffort === activity.id ? 'animate-spin' : ''}`} />
                                {extractingBestEffort === activity.id ? "Scanning..." : hasBestEffort ? "Re-scan Best Efforts" : "Scan for Best Efforts"}
                              </Button>
                            )}
                          </div>
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
