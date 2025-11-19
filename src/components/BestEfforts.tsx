import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Info, RefreshCw } from "lucide-react";
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
  distance: number;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  is_estimated: boolean;
}

interface BestEffortsProps {
  runnerId: string;
  isOwnProfile?: boolean;
  onCalculate?: () => void;
  isCalculating?: boolean;
}

const DISTANCE_LABELS: Record<number, string> = {
  400: "400m",
  1000: "1km",
  1609: "1 mile",
  5000: "5km",
  10000: "10km",
  21097: "Half Marathon",
  42195: "Marathon",
};

export default function BestEfforts({ runnerId, isOwnProfile, onCalculate, isCalculating }: BestEffortsProps) {
  const [efforts, setEfforts] = useState<BestEffort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBestEfforts = async () => {
      try {
        const { data, error } = await supabase
          .from("best_efforts")
          .select("*")
          .eq("runner_id", runnerId)
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPace = (distance: number, seconds: number) => {
    const miles = distance / 1609.34;
    const paceSeconds = seconds / miles;
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.floor(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
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

  if (efforts.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Personal Bests
          </div>
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
                    Your personal best efforts show estimated times for standard running distances (1 mile, 5K, 10K, half marathon, and marathon) based on your activity data.
                  </p>
                  <p className="font-semibold text-foreground">How to get accurate best efforts:</p>
                  <p>
                    Due to Strava API rate limits (1,000 requests per day for all users), we can't automatically fetch detailed data for every activity. Instead:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Initial estimates are calculated from your existing activity data</li>
                    <li>If you know which activities contain your PRs, expand them in the Activities table below</li>
                    <li>Click the <span className="font-semibold">"Find Best Efforts"</span> button (stopwatch icon) to fetch full details from Strava</li>
                    <li>You can extract accurate best efforts from up to <span className="font-semibold">10 activities per week</span></li>
                  </ol>
                  <p className="text-xs text-muted-foreground italic">
                    This approach ensures we stay within API limits while letting you manually discover your true personal records.
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            No best efforts recorded yet. Sync your Strava data to see your personal records.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-base">Personal Bests</span>
            </div>
            <div className="flex items-center gap-1">
              {isOwnProfile && onCalculate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onCalculate}
                        disabled={isCalculating}
                        className="h-8 w-8"
                      >
                        <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm p-3">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-xs">Find Best Efforts (Estimates)</p>
                        <p className="text-[10px] text-muted-foreground">
                          Analyzes your top 20-30 fastest activities to estimate best times. Makes Strava API calls for detailed performance data.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                        Your personal best efforts show estimated times for standard running distances (1 mile, 5K, 10K, half marathon, and marathon) based on your activity data.
                      </p>
                      <p className="font-semibold text-foreground">How to get accurate best efforts:</p>
                      <p>
                        To respect Strava's usage policies and maintain our integration in good standing, we calculate initial estimates from your synced activity data. For more precision:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Initial estimates are calculated from your existing activity data</li>
                        <li>If you know which activities contain your PRs, expand them in the Activities table above</li>
                        <li>Click the <span className="font-semibold">"Find Best Efforts"</span> button (stopwatch icon) to fetch full details from Strava</li>
                        <li>You can extract accurate best efforts from up to <span className="font-semibold">10 activities per week</span></li>
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
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Distance</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Time</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Pace</th>
                <th className="text-left py-2 px-2 sm:px-4 text-xs font-semibold text-foreground whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody>
              {efforts.map((effort, index) => (
                <tr 
                  key={effort.distance}
                  className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${
                    index === 0 ? 'border-t border-border/50' : ''
                  }`}
                >
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-semibold text-foreground whitespace-nowrap text-xs">
                          {DISTANCE_LABELS[effort.distance] || `${(effort.distance / 1000).toFixed(1)}km`}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-5">
                        {effort.is_estimated ? 'Estimated' : 'Actual'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <span className="font-mono text-xs text-foreground whitespace-nowrap">
                      {formatTime(effort.elapsed_time)}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <span className="text-xs text-primary font-medium whitespace-nowrap">
                      {formatPace(effort.distance, effort.moving_time)}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(effort.start_date).toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
