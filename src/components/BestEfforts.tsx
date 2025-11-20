import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Info, RefreshCw, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BestEffort {
  id: string;
  distance: number;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  is_estimated: boolean;
  is_current_pr: boolean;
  achieved_at: string;
  strava_activity_id?: number;
}

interface BestEffortsProps {
  runnerId: string;
  isOwnProfile?: boolean;
  onCalculate?: () => void;
  isCalculating?: boolean;
}

// All 14 standard distances in meters
const DISTANCE_LABELS: Record<number, string> = {
  400: "400m",
  800: "800m",
  1000: "1km",
  1609: "1 Mile",
  3219: "2 Miles",
  5000: "5km",
  10000: "10km",
  15000: "15km",
  16093: "10 Miles",
  20000: "20km",
  21097: "Half Marathon",
  30000: "30km",
  42195: "Marathon",
  50000: "50km",
};

const STANDARD_DISTANCES = [400, 800, 1000, 1609, 3219, 5000, 10000, 15000, 16093, 20000, 21097, 30000, 42195, 50000];

export default function BestEfforts({ runnerId, isOwnProfile, onCalculate, isCalculating }: BestEffortsProps) {
  const [efforts, setEfforts] = useState<BestEffort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDistance, setExpandedDistance] = useState<number | null>(null);
  const [historicalEfforts, setHistoricalEfforts] = useState<{ [key: number]: BestEffort[] }>({});

  useEffect(() => {
    const fetchBestEfforts = async () => {
      try {
        // Fetch current PRs (is_current_pr = true)
        const { data, error } = await supabase
          .from("best_efforts")
          .select("*")
          .eq("runner_id", runnerId)
          .eq("is_current_pr", true)
          .order("distance", { ascending: true });

        if (error) throw error;
        setEfforts(data || []);
      } catch (error) {
        console.error("Error fetching best efforts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestEfforts();
  }, [runnerId]);

  const fetchHistoricalEfforts = async (distance: number) => {
    const { data, error } = await supabase
      .from("best_efforts")
      .select("*")
      .eq("runner_id", runnerId)
      .eq("distance", distance)
      .eq("is_current_pr", false)
      .order("achieved_at", { ascending: false });

    if (!error && data) {
      setHistoricalEfforts(prev => ({ ...prev, [distance]: data }));
    }
  };

  const toggleExpand = (distance: number) => {
    if (expandedDistance === distance) {
      setExpandedDistance(null);
    } else {
      setExpandedDistance(distance);
      if (!historicalEfforts[distance]) {
        fetchHistoricalEfforts(distance);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPace = (distance: number, seconds: number) => {
    if (seconds === 0) return "—";
    const miles = distance / 1609.34;
    const paceSeconds = seconds / miles;
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.floor(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
  };

  const calculateEstimatedTime = (targetDistance: number): number => {
    // Find the closest actual (non-estimated) effort to base estimation on
    const actualEfforts = efforts.filter(e => !e.is_estimated && e.elapsed_time > 0);
    if (actualEfforts.length === 0) return 0;

    // Use the effort with closest distance
    const closest = actualEfforts.reduce((prev, curr) => 
      Math.abs(curr.distance - targetDistance) < Math.abs(prev.distance - targetDistance) ? curr : prev
    );

    // Calculate pace from closest effort and apply to target distance
    const pacePerMeter = closest.moving_time / closest.distance;
    return Math.round(pacePerMeter * targetDistance);
  };

  if (isLoading) {
    return (
      <Card className="bg-card/60 backdrop-blur-[40px] border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Personal Bests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading best efforts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-[40px] border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-base">Personal Bests</span>
            </div>
            <div className="flex items-center gap-1">
              {isOwnProfile && onCalculate && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCalculate}
                  disabled={isCalculating}
                  className="h-7 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${isCalculating ? 'animate-spin' : ''}`} />
                  Calculate Best Efforts
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>About Personal Best Efforts</DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                  <p>
                    Your personal best efforts show estimated times for standard running distances based on your activity data.
                  </p>
                  <p className="font-semibold text-foreground">How to get accurate best efforts:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Initial estimates are calculated from your existing activity data</li>
                    <li>Click the refresh button above to analyze your top 20 fastest activities for better estimates</li>
                    <li>If you know which activities contain your PRs, expand them in the Activities table above</li>
                    <li>Click the <span className="font-semibold">"Find Best Efforts"</span> button (stopwatch icon) to fetch full details from Strava</li>
                  </ol>
                  <p className="text-xs text-muted-foreground italic">
                    This approach keeps us in good standing with Strava while letting you manually discover your true personal records.
                  </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground w-8"></th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Distance</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Time</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Pace</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_DISTANCES.map((distance, index) => {
                const effort = efforts.find(e => e.distance === distance);
                const time = effort?.elapsed_time || calculateEstimatedTime(distance);
                const isEstimated = !effort || effort.is_estimated || effort.elapsed_time === 0;
                const hasHistory = historicalEfforts[distance]?.length > 0;
                const isExpanded = expandedDistance === distance;

                return (
                  <>
                    <tr 
                      key={distance}
                      className={`border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${
                        index === 0 ? 'border-t border-border/50' : ''
                      }`}
                      onClick={() => toggleExpand(distance)}
                    >
                      <td className="py-2 px-2 sm:px-4">
                        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </td>
                      <td className="py-2 px-2 sm:px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="font-semibold text-foreground whitespace-nowrap text-xs">
                              {DISTANCE_LABELS[distance]}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-5">
                            {isEstimated ? 'Estimated' : 'Actual'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-4">
                        <span className="font-mono text-xs text-foreground whitespace-nowrap">
                          {formatTime(time)}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-4">
                        <span className="text-xs text-primary font-medium whitespace-nowrap">
                          {formatPace(distance, time)}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-4">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {effort?.start_date
                            ? new Date(effort.start_date).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : "—"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && hasHistory && (
                      <tr className="bg-muted/10">
                        <td colSpan={5} className="py-2 px-4">
                          <div className="pl-8 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Previous Best Efforts:</p>
                            {historicalEfforts[distance]?.map((historical) => (
                              <div key={historical.id} className="flex items-center gap-4 text-xs py-1">
                                <span className="font-mono font-medium">{formatTime(historical.moving_time)}</span>
                                <span className="text-muted-foreground">{formatPace(distance, historical.moving_time)}</span>
                                <span className="text-muted-foreground">
                                  {new Date(historical.achieved_at).toLocaleDateString('en-US', { 
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {historical.strava_activity_id && (
                                  <a 
                                    href={`https://www.strava.com/activities/${historical.strava_activity_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Activity →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
