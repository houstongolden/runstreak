import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flame, Calendar, TrendingUp, Award, Clock, Mountain, RefreshCw } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import ActivityHeatmap from "@/components/ActivityHeatmap";

export default function RunnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [streakView, setStreakView] = useState<"current" | "longest" | "fiveday">("current");

  useEffect(() => {
    const fetchRunner = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("runners")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        setRunner(data as Runner);
      } catch (error) {
        console.error("Error fetching runner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRunner();
  }, [id]);

  const handleSync = async () => {
    if (!id) return;
    
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-strava', {
        body: { runnerId: id }
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: "Your Strava data has been refreshed successfully.",
      });

      // Refresh runner data
      const { data, error: fetchError } = await supabase
        .from("runners")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setRunner(data as Runner);
    } catch (error) {
      console.error("Error syncing Strava data:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to refresh your Strava data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading runner profile...</div>
      </div>
    );
  }

  if (!runner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Runner not found</h2>
          <Button onClick={() => navigate("/")}>Back to Leaderboard</Button>
        </div>
      </div>
    );
  }

  const streakActive = runner.streak_status === "active";

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with Logo, Back Button, and Sync */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-8 w-8 text-primary" />
              <span className="hidden sm:inline text-2xl font-bold font-instrument-serif bg-gradient-to-r from-[hsl(25_100%_60%)] to-[hsl(15_100%_50%)] bg-clip-text text-transparent">
                RunStreak
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leaderboard
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Strava'}
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={runner.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {runner.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold mb-2">{runner.display_name}</h1>
                  <p className="text-muted-foreground mb-4">@{runner.strava_username}</p>
                  
                  <Badge variant={streakActive ? "default" : "secondary"} className="mb-4">
                    {streakActive ? (
                      <>
                        <Flame className="h-4 w-4 mr-1" />
                        Active Streak
                      </>
                    ) : (
                      "Streak Broken"
                    )}
                  </Badge>

                  {runner.last_activity_date && (
                    <p className="text-sm text-muted-foreground">
                      Last activity: {new Date(runner.last_activity_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="w-full lg:w-auto lg:min-w-[300px]">
                <ActivityHeatmap runnerId={runner.id} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Stats with Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Streak Stats</h2>
            <Tabs value={streakView} onValueChange={(v) => setStreakView(v as "current" | "longest" | "fiveday")}>
              <TabsList>
                <TabsTrigger value="current">Current Streak</TabsTrigger>
                <TabsTrigger value="longest">Longest Streak</TabsTrigger>
                <TabsTrigger value="fiveday">5-Day Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {streakView === "fiveday" ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">5-Day Week Streak</h3>
                  <p className="text-muted-foreground">
                    Coming soon: Track your longest streak of running at least 5 days per week (1+ mile per day).
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak Days</CardTitle>
                <Flame className="h-4 w-4 text-[hsl(25_100%_60%)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {streakView === "current" ? runner.current_streak_days : runner.longest_streak_ever}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(streakView === "current" ? runner.current_streak_days : runner.longest_streak_ever) === 1 ? "day" : "days"} {streakView === "current" ? "in a row" : "best"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {streakView === "current" ? "Streak Miles" : "Total Miles"}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(streakView === "current" ? runner.current_streak_miles : runner.all_time_distance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {streakView === "current" ? "total distance" : "all time"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {streakView === "current" ? "Status" : "Total Runs"}
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {streakView === "current" ? (
                  <>
                    <div className="text-3xl font-bold capitalize">{runner.streak_status}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      current state
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{runner.all_time_run_count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      all time runs
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily Miles</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(runner.average_miles_per_day)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  per day
                </p>
              </CardContent>
            </Card>
              </>
            )}
          </div>
        </div>

        {/* Year-to-Date Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Year-to-Date Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{runner.ytd_run_count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  this year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(runner.ytd_distance || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  miles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatTime(runner.ytd_moving_time || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  moving time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Elevation Gain</CardTitle>
                <Mountain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(runner.ytd_elevation_gain || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  feet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All-Time Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">All-Time Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{runner.all_time_run_count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  all time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(runner.all_time_distance || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  miles all time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Streak Timeline */}
        {runner.streak_start_date && (
          <Card>
            <CardHeader>
              <CardTitle>Streak Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak Started</span>
                  <span className="font-medium">
                    {new Date(runner.streak_start_date).toLocaleDateString()}
                  </span>
                </div>
                {runner.last_activity_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Activity</span>
                    <span className="font-medium">
                      {new Date(runner.last_activity_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">Total Duration</span>
                  <span className="font-medium">
                    {runner.current_streak_days} {runner.current_streak_days === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
