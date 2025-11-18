import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, CloudRain, Sun, CloudSnow, Wind, CheckCircle2, XCircle, Users, MapPin, Loader2, Award, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import ActivityKudos from "@/components/ActivityKudos";
import ActivityComments, { ActivityCommentsSection } from "@/components/ActivityComments";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FollowButton } from "@/components/FollowButton";
import { AccountabilityPartnerButton } from "@/components/AccountabilityPartnerButton";
import { Tables } from "@/integrations/supabase/types";

type Runner = Tables<"runners">;

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
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"feed" | "discover">("feed");
  const [runners, setRunners] = useState<Runner[]>([]);
  const [runnersLoading, setRunnersLoading] = useState(false);
  const [discoverTab, setDiscoverTab] = useState<"nearby" | "similar" | "leaders">("leaders");

  useEffect(() => {
    if (currentRunnerId) {
      loadFeed(currentRunnerId);
    } else {
      setLoading(false);
    }
  }, [currentRunnerId, filter]);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchRunners();
    }
  }, [activeTab]);

  const fetchRunners = async () => {
    setRunnersLoading(true);
    try {
      const { data, error } = await supabase
        .from("runners")
        .select("*")
        .order("current_streak_days", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRunners(data || []);
    } catch (error) {
      console.error("Error fetching runners:", error);
    } finally {
      setRunnersLoading(false);
    }
  };

  const getNearbyRunners = () => {
    if (!currentRunnerId) return [];
    const currentRunner = runners.find(r => r.id === currentRunnerId);
    if (!currentRunner?.city) return [];
    
    return runners.filter(r => 
      r.city === currentRunner.city && r.id !== currentRunnerId
    );
  };

  const getSimilarPaceRunners = () => {
    if (!currentRunnerId) return [];
    const currentRunner = runners.find(r => r.id === currentRunnerId);
    if (!currentRunner?.average_miles_per_day) return [];
    
    const currentPace = currentRunner.average_miles_per_day;
    return runners
      .filter(r => r.average_miles_per_day && r.id !== currentRunnerId)
      .filter(r => {
        const diff = Math.abs((r.average_miles_per_day || 0) - currentPace);
        return diff < 2; // Within 2 miles per day
      })
      .sort((a, b) => {
        const diffA = Math.abs((a.average_miles_per_day || 0) - currentPace);
        const diffB = Math.abs((b.average_miles_per_day || 0) - currentPace);
        return diffA - diffB;
      });
  };

  const getStreakLeaders = () => {
    return runners
      .filter(r => r.id !== currentRunnerId)
      .sort((a, b) => (b.current_streak_days || 0) - (a.current_streak_days || 0))
      .slice(0, 20);
  };

  const loadFeed = async (runnerId: string) => {
    try {
      setLoading(true);

      const { data: follows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", runnerId);

      const followingIds = follows ? follows.map((f) => f.following_id) : [];
      const allRunnerIds = [runnerId, ...followingIds];

      if (filter === "kept") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentActivities, error } = await supabase
          .from("daily_activities")
          .select("runner_id, activity_date, average_temp, distance, moving_time, run_count")
          .in("runner_id", allRunnerIds)
          .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("activity_date", { ascending: false });

        if (error) throw error;

        const { data: runners } = await supabase
          .from("runners")
          .select("id, display_name, avatar_url, current_streak_days")
          .in("id", allRunnerIds);

        if (!runners) return;

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
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: brokenStreaks, error } = await supabase
          .from("streak_history")
          .select("runner_id, end_date, days_count, total_miles")
          .in("runner_id", allRunnerIds)
          .gte("end_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("end_date", { ascending: false });

        if (error) throw error;

        const { data: runners } = await supabase
          .from("runners")
          .select("id, display_name, avatar_url, current_streak_days")
          .in("id", allRunnerIds);

        if (!runners) return;

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

  const RunnerCard = ({ runner }: { runner: Runner }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/runner/${runner.id}`)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={runner.avatar_url || undefined} />
            <AvatarFallback>{runner.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{runner.display_name}</h3>
            {(runner.city || runner.state) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {[runner.city, runner.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="gap-1">
                <Flame className="h-3 w-3" />
                {runner.current_streak_days || 0} days
              </Badge>
              {runner.average_miles_per_day && (
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {runner.average_miles_per_day.toFixed(1)} mi/day
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          {currentRunnerId && runner.id !== currentRunnerId && (
            <>
              <FollowButton targetRunnerId={runner.id} currentRunnerId={currentRunnerId} />
              <AccountabilityPartnerButton 
                targetRunnerId={runner.id} 
                targetRunnerName={runner.display_name}
                currentRunnerId={currentRunnerId}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!currentRunnerId) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Connect with Strava to see your social feed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && activeTab === "feed") {
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

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "feed" | "discover")} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Streak Feed
          </h1>
          
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="feed" className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Discover</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feed" className="space-y-4 mt-0">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "kept" | "broke")} className="w-full">
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

          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    {filter === "kept" 
                      ? "Follow other runners to see their activities here"
                      : "You're not following anyone who has broken a streak yet"
                    }
                  </p>
                  {filter === "kept" && (
                    <p className="text-sm text-muted-foreground">
                      Visit runner profiles to follow them and stay updated on their streaks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => {
                const isOwnActivity = activity.runner_id === currentRunnerId;
                const commentKey = `${activity.runner_id}-${activity.activity_date}`;
                const isCommentsExpanded = expandedComments.has(commentKey);
                
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

                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-4">
                          <ActivityKudos 
                            runnerId={activity.runner_id} 
                            activityDate={activity.activity_date}
                          />
                          <div onClick={() => {
                            const newExpanded = new Set(expandedComments);
                            if (isCommentsExpanded) {
                              newExpanded.delete(commentKey);
                            } else {
                              newExpanded.add(commentKey);
                            }
                            setExpandedComments(newExpanded);
                          }}>
                            <ActivityComments
                              activityRunnerId={activity.runner_id}
                              activityDate={activity.activity_date}
                              currentRunnerId={currentRunnerId || undefined}
                            />
                          </div>
                        </div>
                        
                        <ActivityCommentsSection
                          activityRunnerId={activity.runner_id}
                          activityDate={activity.activity_date}
                          currentRunnerId={currentRunnerId || undefined}
                          showComments={isCommentsExpanded}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-0 space-y-4">
          <Tabs value={discoverTab} onValueChange={(v) => setDiscoverTab(v as "nearby" | "similar" | "leaders")} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nearby" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">Nearby</span>
              </TabsTrigger>
              <TabsTrigger value="similar" className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">Similar Pace</span>
              </TabsTrigger>
              <TabsTrigger value="leaders" className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">Leaders</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {runnersLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : discoverTab === "nearby" ? (
            getNearbyRunners().length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No nearby runners found in your area</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {getNearbyRunners().map((runner) => (
                  <RunnerCard key={runner.id} runner={runner} />
                ))}
              </div>
            )
          ) : discoverTab === "similar" ? (
            getSimilarPaceRunners().length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No runners with similar pace found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {getSimilarPaceRunners().map((runner) => (
                  <RunnerCard key={runner.id} runner={runner} />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {getStreakLeaders().map((runner) => (
                <RunnerCard key={runner.id} runner={runner} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
