import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Timer, Trophy, Zap, Watch, Activity, Hand, Smartphone } from "lucide-react";
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
  const [bulkEnriching, setBulkEnriching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [stableCount, setStableCount] = useState(0);
  const [lastActivityCount, setLastActivityCount] = useState(0);
  
  const isOwnProfile = currentUserRunnerId === runnerId;
  
  const getDeviceIcon = (deviceName: string | null, isManual: boolean | null) => {
    if (isManual) {
      return <Hand className="h-3 w-3 text-muted-foreground" />;
    }
    
    if (!deviceName) {
      return <Smartphone className="h-3 w-3 text-muted-foreground" />;
    }
    
    const deviceLower = deviceName.toLowerCase();
    
    // Check for watch
    if (deviceLower.includes('watch') || deviceLower.includes('garmin') || deviceLower.includes('apple') || 
        deviceLower.includes('suunto') || deviceLower.includes('polar') || deviceLower.includes('coros')) {
      return <Watch className="h-3 w-3 text-muted-foreground" />;
    }
    
    // Check for heart rate monitor
    if (deviceLower.includes('heart') || deviceLower.includes('hrm') || deviceLower.includes('h10') || 
        deviceLower.includes('tickr') || deviceLower.includes('rhythm') || deviceLower.includes('wahoo')) {
      return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
    
    // Default to phone/device icon
    return <Smartphone className="h-3 w-3 text-muted-foreground" />;
  };
  
  // Calculate stats
  const totalActivities = activities.length;
  const activitiesWithPRs = activities.filter(a => a.pr_count && a.pr_count > 0).length;
  const prActivities = activities.filter(a => a.pr_count && a.pr_count > 0);

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

  // Poll for new activities to detect sync
  useEffect(() => {
    if (!isOwnProfile) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: activitiesData } = await supabase
          .from('strava_activities')
          .select('id')
          .eq('runner_id', runnerId);

        const currentCount = activitiesData?.length || 0;
        
        if (isScanning) {
          // Already scanning - check if count is stable
          if (currentCount === lastActivityCount) {
            const newStableCount = stableCount + 1;
            setStableCount(newStableCount);
            
            // Stop after 3 stable checks (6 seconds)
            if (newStableCount >= 3) {
              setIsScanning(false);
              window.location.reload();
            }
          } else {
            // Count changed - keep scanning and reset stable counter
            setStableCount(0);
            setLastActivityCount(currentCount);
          }
        } else {
          // Not scanning yet - check if count is increasing (sync started)
          if (currentCount > lastActivityCount && lastActivityCount > 0) {
            setIsScanning(true);
            setScanStartTime(Date.now());
            setLastActivityCount(currentCount);
            setStableCount(0);
          } else if (lastActivityCount === 0) {
            // First load
            setLastActivityCount(currentCount);
          }
        }
      } catch (error) {
        console.error('Error polling activities:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isScanning, runnerId, lastActivityCount, stableCount, isOwnProfile]);

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

  const bulkEnrichPRActivities = async () => {
    setBulkEnriching(true);
    try {
      // Determine batch size based on total PR activities
      const batchSize = prActivities.length <= 20 ? prActivities.length : Math.min(20, prActivities.length);
      const activitiesToEnrich = prActivities.slice(0, batchSize);
      
      toast.success(`Starting enrichment of ${activitiesToEnrich.length} PR activities...`);
      
      let successCount = 0;
      for (const activity of activitiesToEnrich) {
        try {
          await extractBestEffort(activity.id, activity.strava_activity_id);
          successCount++;
        } catch (error) {
          console.error(`Failed to enrich activity ${activity.id}:`, error);
        }
      }
      
      toast.success(`Enriched ${successCount} of ${activitiesToEnrich.length} PR activities!`);
    } catch (error: any) {
      console.error('Error bulk enriching:', error);
      toast.error('Failed to bulk enrich activities');
    } finally {
      setBulkEnriching(false);
    }
  };

  if (loading || isScanning) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="space-y-6">
            {/* Animated Message */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground animate-fade-in">
                Scanning all your activities...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {lastActivityCount > 0 ? `${lastActivityCount} activities scanned` : 'Loading...'}
              </p>
            </div>

            {/* Activity Heatmap Mockup with Scanning Animation */}
            <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-muted/30 p-6 h-64 max-w-2xl mx-auto">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-4">Activity Map</p>
                <div className="grid grid-cols-12 gap-1.5">
                  {Array.from({ length: 84 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 w-5 rounded transition-all duration-300 ${
                        i < Math.floor((lastActivityCount / 200) * 84) ? 'bg-primary/70 scale-110' : 
                        i % 4 === 0 ? 'bg-primary/40' : 
                        i % 3 === 0 ? 'bg-primary/20' : 
                        'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Scanning Bar Animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-in-right_2.5s_ease-in-out_infinite]" 
                     style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
      <CardContent className="p-4">
        {/* Stats Section */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Activities: </span>
              <span className="font-semibold text-foreground">{totalActivities}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Activities with PRs: </span>
              <span className="font-semibold text-foreground">{activitiesWithPRs}</span>
            </div>
          </div>
          {isOwnProfile && activitiesWithPRs > 0 && (
            <Button
              onClick={bulkEnrichPRActivities}
              disabled={bulkEnriching}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <Zap className={`h-4 w-4 ${bulkEnriching ? 'animate-pulse' : ''}`} />
              {bulkEnriching ? "Enriching..." : `Enrich ${Math.min(20, prActivities.length)} PR Activities`}
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-2 w-8"></TableHead>
                <TableHead className="text-xs py-2">Date</TableHead>
                <TableHead className="text-xs py-2 text-right">Distance</TableHead>
                <TableHead className="text-xs py-2 text-right">Time</TableHead>
                <TableHead className="text-xs py-2 text-right">Avg Pace</TableHead>
                <TableHead className="text-xs py-2">Name</TableHead>
                <TableHead className="text-xs py-2 text-right">Elevation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const isExpanded = expandedRows.has(activity.id);
                const hasBestEffort = bestEffortIds.has(activity.strava_activity_id);
                
                return (
                  <React.Fragment key={activity.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
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
                            return format(localDate, "MMM d, ''yy");
                          })()}
                          {activity.pr_count && activity.pr_count > 0 && (
                            <Badge 
                              variant="default" 
                              className={`gap-1 text-xs px-1.5 py-0 h-5 bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)] ${isOwnProfile ? 'cursor-pointer hover:from-orange-600 hover:to-orange-700' : ''}`}
                              onClick={isOwnProfile ? (e) => {
                                e.stopPropagation();
                                extractBestEffort(activity.id, activity.strava_activity_id);
                              } : undefined}
                            >
                              <Zap className="h-3 w-3" />
                              PR
                            </Badge>
                          )}
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
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {formatNumber(activity.distance)} mi
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {Math.floor(activity.moving_time / 60)}m
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right" onClick={() => toggleRow(activity.id)}>
                        {activity.average_speed ? (
                          <span className="font-semibold">{Math.floor(26.8224 / activity.average_speed)}:{String(Math.round((26.8224 / activity.average_speed % 1) * 60)).padStart(2, '0')}/mi</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm py-2 max-w-[200px] truncate" onClick={() => toggleRow(activity.id)}>
                        {activity.name || 'Unnamed Activity'}
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
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground">Device: </span>
                                  <span className="text-foreground flex items-center gap-1">
                                    {getDeviceIcon(activity.device_name, activity.manual)}
                                    {activity.device_name}
                                  </span>
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
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
