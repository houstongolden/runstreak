import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, TrendingUp, CloudRain, Sun, CloudSnow, Wind, Heart, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import ActivityKudos from "@/components/ActivityKudos";
import ActivityComments from "@/components/ActivityComments";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeedActivity {
  runner_id: string;
  runner_name: string;
  runner_avatar: string;
  current_streak: number;
  activity_date: string;
  average_temp?: number | null;
  distance?: number;
  moving_time?: number;
  run_count?: number;
}

export default function SocialFeed() {
  const navigate = useNavigate();
  const { runnerId: currentRunnerId } = useAuth();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"kept" | "broke">("kept");

  useEffect(() => {
    if (currentRunnerId) {
      loadFeed(currentRunnerId);
    } else {
      setLoading(false);
    }
  }, [currentRunnerId, filter]);

  const loadFeed = async (runnerId: string) => {
    try {
      setLoading(true);

      // Get runners that current user follows
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", runnerId);

      // Include the current user's own ID plus any following
      const followingIds = follows ? follows.map((f) => f.following_id) : [];
      const allRunnerIds = [runnerId, ...followingIds];

      if (filter === "kept") {
        // Get recent activities from followed runners + self (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentActivities, error } = await supabase
          .from("daily_activities")
          .select("runner_id, activity_date, average_temp, distance, moving_time, run_count")
          .in("runner_id", allRunnerIds)
          .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("activity_date", { ascending: false });

        if (error) throw error;

        // Get runner details for each activity
        const { data: runners } = await supabase
          .from("runners")
          .select("id, display_name, avatar_url, current_streak_days")
          .in("id", allRunnerIds);

        if (!runners) return;

        // Combine activities with runner info
        const feedItems: FeedActivity[] = (recentActivities || []).map((activity) => {
          const runner = runners.find((r) => r.id === activity.runner_id);
          return {
            runner_id: activity.runner_id,
            runner_name: runner?.display_name || "Unknown Runner",
            runner_avatar: runner?.avatar_url || "",
            current_streak: runner?.current_streak_days || 0,
            activity_date: activity.activity_date,
            average_temp: activity.average_temp,
            distance: activity.distance,
            moving_time: activity.moving_time,
            run_count: activity.run_count,
          };
        });

        setActivities(feedItems);
      } else {
        // Get recent broken streaks from streak_history (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: brokenStreaks, error } = await supabase
          .from("streak_history")
          .select("runner_id, end_date, days_count, total_miles")
          .in("runner_id", allRunnerIds)
          .gte("end_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("end_date", { ascending: false });

        if (error) throw error;

        // Get runner details
        const { data: runners } = await supabase
          .from("runners")
          .select("id, display_name, avatar_url, current_streak_days")
          .in("id", allRunnerIds);

        if (!runners) return;

        // Combine broken streaks with runner info
        const feedItems: FeedActivity[] = (brokenStreaks || []).map((streak) => {
          const runner = runners.find((r) => r.id === streak.runner_id);
          return {
            runner_id: streak.runner_id,
            runner_name: runner?.display_name || "Unknown Runner",
            runner_avatar: runner?.avatar_url || "",
            current_streak: runner?.current_streak_days || 0,
            activity_date: streak.end_date,
            distance: streak.total_miles,
            moving_time: 0,
            run_count: streak.days_count,
          };
        });

        setActivities(feedItems);
      }
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentRunnerId) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Social Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Connect with Strava to see your social feed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-4">
        <Skeleton className="h-12 w-64" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Social Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Follow other runners to see their activities here
              </p>
              <p className="text-sm text-muted-foreground">
                Visit runner profiles to follow them and stay updated on their streaks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Streak Feed
        </h1>
        
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "kept" | "broke")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kept" className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Kept Streaks</span>
            </TabsTrigger>
            <TabsTrigger value="broke" className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Broke Streaks</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => {
          const isOwnActivity = activity.runner_id === currentRunnerId;
          
          return (
            <Card
              key={`${activity.runner_id}-${activity.activity_date}-${index}`}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer mb-4"
                  onClick={() => navigate(`/runner/${activity.runner_id}`)}
                >
                  <Avatar className={`h-10 w-10 shrink-0 ${isOwnActivity ? 'ring-2 ring-orange-500' : ''}`}>
                    <AvatarImage src={activity.runner_avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.runner_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {activity.runner_name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {filter === "kept" ? "kept streak alive" : "broke their streak"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>
                        {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <span>
                        {filter === "kept" 
                          ? `Day ${activity.current_streak} of streak`
                          : `${activity.run_count}-day streak ended`
                        }
                      </span>
                    </div>

                    {/* Activity details */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.distance && (
                        <>
                          <span className="font-medium text-foreground">
                            {activity.distance.toFixed(2)} mi
                          </span>
                          <span>•</span>
                        </>
                      )}
                      {activity.run_count && activity.run_count > 1 && (
                        <>
                          <span>{activity.run_count} runs</span>
                          <span>•</span>
                        </>
                      )}
                      {activity.moving_time && (
                        <span>
                          {Math.floor(activity.moving_time / 60)}:{String(activity.moving_time % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activity.average_temp !== null && activity.average_temp !== undefined && (
                      <div className="shrink-0" title={`${activity.average_temp.toFixed(0)}°C`}>
                        {activity.average_temp < 0 ? (
                          <CloudSnow className="h-4 w-4 text-blue-400" />
                        ) : activity.average_temp < 10 ? (
                          <Wind className="h-4 w-4 text-blue-300" />
                        ) : activity.average_temp > 30 ? (
                          <Sun className="h-4 w-4 text-orange-500" />
                        ) : activity.average_temp > 20 ? (
                          <Sun className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CloudRain className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="bg-orange-500/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-sm">{activity.current_streak}</span>
                    </div>
                  </div>
                </div>

                {/* Kudos and Comments - Fixed at bottom */}
                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center gap-4">
                    <ActivityKudos 
                      runnerId={activity.runner_id} 
                      activityDate={activity.activity_date}
                    />
                    <ActivityComments
                      activityRunnerId={activity.runner_id}
                      activityDate={activity.activity_date}
                      currentRunnerId={currentRunnerId || undefined}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
