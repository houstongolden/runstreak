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
              className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-foreground">
                  {DISTANCE_LABELS[effort.distance] || `${effort.distance}m`}
                </div>
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {formatTime(effort.elapsed_time)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPace(effort.distance, effort.elapsed_time)}
                </div>
                {effort.start_date && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(effort.start_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
