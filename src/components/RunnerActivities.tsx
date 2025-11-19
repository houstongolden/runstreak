import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Timer } from "lucide-react";
import { toast } from "sonner";
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
}

interface RunnerActivitiesProps {
  runnerId: string;
}

export function RunnerActivities({ runnerId }: RunnerActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [extractingBestEffort, setExtractingBestEffort] = useState<string | null>(null);

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
      const { error } = await supabase.functions.invoke('fetch-activity-best-efforts', {
        body: { activity_date: activityDate, runner_id: runnerId }
      });

      if (error) throw error;
      toast.success('Best efforts extracted successfully!');
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
                        {(() => {
                          const [year, month, day] = activity.activity_date.split('-');
                          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          return format(localDate, "MMM d, yy");
                        })()}
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
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {activity.average_speed && (
                              <div>
                                <span className="text-muted-foreground">Avg Speed:</span>{' '}
                                <span className="font-medium">{(activity.average_speed * 2.237).toFixed(2)} mph</span>
                              </div>
                            )}
                            {activity.max_speed && (
                              <div>
                                <span className="text-muted-foreground">Max Speed:</span>{' '}
                                <span className="font-medium">{(activity.max_speed * 2.237).toFixed(2)} mph</span>
                              </div>
                            )}
                            {activity.average_cadence && (
                              <div>
                                <span className="text-muted-foreground">Avg Cadence:</span>{' '}
                                <span className="font-medium">{Math.round(activity.average_cadence * 2)} spm</span>
                              </div>
                            )}
                            {activity.average_heartrate && (
                              <div>
                                <span className="text-muted-foreground">Avg Heart Rate:</span>{' '}
                                <span className="font-medium">{Math.round(activity.average_heartrate)} bpm</span>
                              </div>
                            )}
                            {activity.max_heartrate && (
                              <div>
                                <span className="text-muted-foreground">Max Heart Rate:</span>{' '}
                                <span className="font-medium">{Math.round(activity.max_heartrate)} bpm</span>
                              </div>
                            )}
                            {activity.average_temp !== null && (
                              <div>
                                <span className="text-muted-foreground">Temperature:</span>{' '}
                                <span className="font-medium">{Math.round((activity.average_temp * 9/5) + 32)}°F</span>
                              </div>
                            )}
                            {activity.calories && (
                              <div>
                                <span className="text-muted-foreground">Calories:</span>{' '}
                                <span className="font-medium">{Math.round(activity.calories)}</span>
                              </div>
                            )}
                            {activity.suffer_score && (
                              <div>
                                <span className="text-muted-foreground">Suffer Score:</span>{' '}
                                <span className="font-medium">{activity.suffer_score}</span>
                              </div>
                            )}
                            {activity.photo_count !== null && activity.photo_count > 0 && (
                              <div>
                                <span className="text-muted-foreground">Photos:</span>{' '}
                                <span className="font-medium">{activity.photo_count}</span>
                              </div>
                            )}
                            {activity.achievement_count !== null && activity.achievement_count > 0 && (
                              <div>
                                <span className="text-muted-foreground">Achievements:</span>{' '}
                                <span className="font-medium">{activity.achievement_count}</span>
                              </div>
                            )}
                            {activity.kudos_count !== null && (
                              <div>
                                <span className="text-muted-foreground">Kudos:</span>{' '}
                                <span className="font-medium">{activity.kudos_count}</span>
                              </div>
                            )}
                            {activity.comment_count !== null && (
                              <div>
                                <span className="text-muted-foreground">Comments:</span>{' '}
                                <span className="font-medium">{activity.comment_count}</span>
                              </div>
                            )}
                            {activity.trainer && (
                              <div>
                                <span className="text-muted-foreground">Type:</span>{' '}
                                <span className="font-medium">Trainer</span>
                              </div>
                            )}
                            {activity.commute && (
                              <div>
                                <span className="text-muted-foreground">Type:</span>{' '}
                                <span className="font-medium">Commute</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extractBestEffort(activity.activity_date)}
                              disabled={extractingBestEffort === activity.activity_date}
                              className="gap-2"
                            >
                              <Timer className="h-4 w-4" />
                              {extractingBestEffort === activity.activity_date ? 'Extracting...' : 'Find Best Efforts'}
                            </Button>
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
