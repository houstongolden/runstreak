import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface BestEffort {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
}

interface BestEffortsProps {
  runnerId: string;
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

export default function BestEfforts({ runnerId }: BestEffortsProps) {
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
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Personal Bests
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
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Personal Bests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {efforts.map((effort) => (
            <div
              key={effort.distance}
              className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {DISTANCE_LABELS[effort.distance] || `${effort.distance}m`}
                  </div>
                  {effort.start_date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(effort.start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>
                <Trophy className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Time</span>
                  <span className="font-bold text-base text-foreground">{formatTime(effort.elapsed_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Pace</span>
                  <span className="font-semibold text-sm text-primary">{formatPace(effort.distance, effort.elapsed_time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
