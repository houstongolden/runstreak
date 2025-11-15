import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FeedActivity {
  runner_id: string;
  runner_name: string;
  runner_avatar: string;
  current_streak: number;
  activity_date: string;
}

export default function SocialFeed() {
  const navigate = useNavigate();
  const { runnerId: currentRunnerId } = useAuth();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRunnerId) {
      loadFeed(currentRunnerId);
    } else {
      setLoading(false);
    }
  }, [currentRunnerId]);

  const loadFeed = async (runnerId: string) => {
    try {
      setLoading(true);

      // Get runners that current user follows
      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", runnerId);

      if (!follows || follows.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const followingIds = follows.map((f) => f.following_id);

      // Get recent activities from followed runners (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentActivities, error } = await supabase
        .from("daily_activities")
        .select("runner_id, activity_date")
        .in("runner_id", followingIds)
        .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
        .order("activity_date", { ascending: false });

      if (error) throw error;

      // Get runner details for each activity
      const { data: runners } = await supabase
        .from("runners")
        .select("id, display_name, avatar_url, current_streak_days")
        .in("id", followingIds);

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
        };
      });

      setActivities(feedItems);
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
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Streak Updates
        </h1>
      </div>

      <div className="space-y-2">
        {activities.map((activity, index) => (
          <Card 
            key={`${activity.runner_id}-${activity.activity_date}-${index}`} 
            className="hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => navigate(`/runner/${activity.runner_id}`)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={activity.runner_avatar} />
                  <AvatarFallback>
                    {activity.runner_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate text-sm sm:text-base">
                      {activity.runner_name}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                      kept their streak alive
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 bg-orange-500/10 px-2.5 py-1 rounded-full">
                    <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                    <span className="font-bold text-sm sm:text-base">{activity.current_streak}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
