import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flame, Calendar, TrendingUp, Award } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

export default function RunnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setRunner(data);
      } catch (error) {
        console.error("Error fetching runner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRunner();
  }, [id]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leaderboard
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
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
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{runner.current_streak_days}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {runner.current_streak_days === 1 ? "day" : "days"} in a row
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Miles</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatNumber(runner.current_streak_miles)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                during current streak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Longest Streak Ever</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{runner.longest_streak_ever}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {runner.longest_streak_ever === 1 ? "day" : "days"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Daily Miles</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatNumber(runner.average_miles_per_day)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                miles per day
              </p>
            </CardContent>
          </Card>
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
