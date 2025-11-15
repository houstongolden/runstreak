import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import ActivityKudos from "@/components/ActivityKudos";
import { formatDistance, formatDuration } from "@/lib/formatters";
import { Calendar, Flame, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FeedActivity {
  runner_id: string;
  runner_name: string;
  runner_avatar: string;
  current_streak: number;
  activity_date: string;
  distance: number;
  moving_time: number;
  run_count: number;
  status_text?: string;
}

export default function SocialFeed() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);

  useEffect(() => {
    const runnerId = localStorage.getItem('current_runner_id');
    setCurrentRunnerId(runnerId);
    
    if (runnerId) {
      loadFeed(runnerId);
    } else {
      setLoading(false);
    }
  }, []);

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
        .select(`
          runner_id,
          activity_date,
          distance,
          moving_time,
          run_count
        `)
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

      // Get activity statuses
      const activityKeys = (recentActivities || []).map(a => ({
        runner_id: a.runner_id,
        activity_date: a.activity_date
      }));

      const { data: statuses } = await supabase
        .from("activity_status")
        .select("runner_id, activity_date, status_text")
        .in("runner_id", followingIds)
        .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0]);

      // Combine activities with runner info and statuses
      const feedItems: FeedActivity[] = (recentActivities || []).map((activity) => {
        const runner = runners.find((r) => r.id === activity.runner_id);
        const status = statuses?.find(s => 
          s.runner_id === activity.runner_id && 
          s.activity_date === activity.activity_date
        );
        return {
          runner_id: activity.runner_id,
          runner_name: runner?.display_name || "Unknown Runner",
          runner_avatar: runner?.avatar_url || "",
          current_streak: runner?.current_streak_days || 0,
          activity_date: activity.activity_date,
          distance: activity.distance,
          moving_time: activity.moving_time,
          run_count: activity.run_count,
          status_text: status?.status_text,
        };
      });

      setActivities(feedItems);
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateStatus = async (runnerId: string, activityDate: string) => {
    try {
      toast.info('Generating AI status...');
      const { data, error } = await supabase.functions.invoke('generate-activity-status', {
        body: { runnerId, activityDate }
      });

      if (error) throw error;
      
      toast.success('Status generated!');
      if (currentRunnerId) {
        loadFeed(currentRunnerId); // Refresh to show new status
      }
    } catch (error) {
      console.error('Error generating status:', error);
      toast.error('Failed to generate status');
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
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Social Feed
        </h1>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <Card key={`${activity.runner_id}-${activity.activity_date}-${index}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar
                  className="h-12 w-12 cursor-pointer"
                  onClick={() => navigate(`/runner/${activity.runner_id}`)}
                >
                  <AvatarImage src={activity.runner_avatar} />
                  <AvatarFallback>
                    {activity.runner_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate(`/runner/${activity.runner_id}`)}
                      >
                        {activity.runner_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(activity.activity_date), "MMM d, yyyy")}
                      </div>
                    </div>
                    <FollowButton
                      targetRunnerId={activity.runner_id}
                      currentRunnerId={currentRunnerId}
                    />
                  </div>

                  <p className="text-muted-foreground">
                    Completed {activity.run_count} run{activity.run_count !== 1 ? "s" : ""}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDistance(activity.distance)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDuration(activity.moving_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{activity.current_streak} day streak</span>
                    </div>
                  </div>

                  {activity.status_text && (
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm italic">{activity.status_text}</p>
                    </div>
                  )}

                  {!activity.status_text && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateStatus(activity.runner_id, activity.activity_date)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Generate AI Status
                    </Button>
                  )}

                  <div className="flex items-center pt-3 border-t">
                    <ActivityKudos 
                      runnerId={activity.runner_id}
                      activityDate={activity.activity_date}
                    />
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
