import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Flame, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Mountain, 
  RefreshCw, 
  Medal, 
  Share2,
  Pencil
} from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import AIAnalysisCards from "@/components/AIAnalysisCards";
import ProfileEditor from "@/components/ProfileEditor";
import BestEfforts from "@/components/BestEfforts";
import { FollowButton } from "@/components/FollowButton";
import { AccountabilityPartnerButton } from "@/components/AccountabilityPartnerButton";
import { StreakHistory } from "@/components/StreakHistory";
import { DaysOnStreakCard } from "@/components/DaysOnStreakCard";
import { CurrentStreakCard } from "@/components/CurrentStreakCard";
import { AccountabilityPartnersSection } from "@/components/AccountabilityPartnersSection";
import { useAuth } from "@/contexts/AuthContext";
import { RunnerActivities } from "@/components/RunnerActivities";
import { TabsContent } from "@/components/ui/tabs";
import { OnboardingModal } from "@/components/OnboardingModal";

export default function RunnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { runnerId: currentRunnerId } = useAuth();
  const isOwnProfile = currentRunnerId === id;
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Debug: Onboarding modal state
  const [showDebugOnboarding, setShowDebugOnboarding] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [totalRunners, setTotalRunners] = useState(0);

  // Check if we should auto-open the profile editor from URL parameter
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isOwnProfile) {
      setShowProfileEditor(true);
    }
  }, [searchParams, isOwnProfile]);

  // Debug: Keyboard shortcut to trigger onboarding (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowDebugOnboarding(true);
        toast({
          title: "Debug Mode",
          description: "Onboarding modal triggered for testing",
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  useEffect(() => {
    const fetchRunner = async () => {
      if (!id) return;

      try {
        const { data, error } = await (supabase as any)
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

    const fetchFollowCounts = async () => {
      if (!id) return;

      try {
        const { count: followers } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", id);

        const { count: following } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", id);

        setFollowerCount(followers || 0);
        setFollowingCount(following || 0);
      } catch (error) {
        console.error("Error fetching follow counts:", error);
      }
    };

    fetchRunner();
    fetchFollowCounts();

    // Fetch leaderboard stats for onboarding modal
    const fetchLeaderboardStats = async () => {
      if (!id) return;
      
      try {
        const { count } = await supabase
          .from("runners")
          .select("*", { count: "exact", head: true });
        
        setTotalRunners(count || 0);

        const { data: rankData } = await supabase
          .from("runners")
          .select("id")
          .order("current_streak_days", { ascending: false });
        
        const rank = rankData?.findIndex(r => r.id === id) ?? -1;
        setLeaderboardRank(rank + 1);
      } catch (error) {
        console.error("Error fetching leaderboard stats:", error);
      }
    };

    fetchLeaderboardStats();
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
      const { data, error: fetchError } = await (supabase as any)
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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Header with Back Button and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboard
          </Button>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Button 
                variant="outline"
                onClick={() => setShowProfileEditor(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => {
                const profileUrl = runner.username 
                  ? `${window.location.origin}/runner/${runner.username}`
                  : `${window.location.origin}/runner/${runner.id}`;
                navigator.clipboard.writeText(profileUrl);
                toast({
                  title: "Link Copied!",
                  description: "Profile link copied to clipboard",
                });
              }}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            {isOwnProfile && (
              <Button 
                variant="default" 
                onClick={() => navigate(`/runner/${id}/badge`)}
                className="gap-2"
              >
                <Medal className="h-4 w-4" />
                <span className="hidden sm:inline">Get Badge</span>
              </Button>
            )}
            {isOwnProfile && (
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Strava'}</span>
              </Button>
            )}
          </div>
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
                  
                  {runner.bio && (
                    <p className="text-muted-foreground mb-3">{runner.bio}</p>
                  )}
                  
                  {(runner.city || runner.state || runner.country) && (
                    <p className="text-sm text-muted-foreground mb-3">
                      📍 {[runner.city, runner.state, runner.country].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {/* Follower/Following Counts */}
                  <div className="flex gap-4 mb-3 justify-center sm:justify-start">
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{followerCount}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{followingCount}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="flex gap-2 mb-3 flex-wrap justify-center sm:justify-start">
                      <FollowButton
                        targetRunnerId={runner.id}
                        currentRunnerId={currentRunnerId}
                        onFollowChange={(_, newCount) => setFollowerCount(newCount)}
                      />
                      <AccountabilityPartnerButton
                        targetRunnerId={runner.id}
                        targetRunnerName={runner.display_name}
                        currentRunnerId={currentRunnerId}
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant={streakActive ? "default" : "secondary"}>
                      {streakActive ? (
                        <>
                          <Flame className="h-4 w-4 mr-1" />
                          Active Streak
                        </>
                      ) : (
                        "No Active Streak"
                      )}
                    </Badge>
                    
                    {runner.created_at_strava && (
                      <Badge variant="outline">
                        Member since {new Date(runner.created_at_strava).getFullYear()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-auto lg:min-w-[300px]">
                <ActivityHeatmap runnerId={runner.id} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Editor Modal/Dialog */}
        {showProfileEditor && (
          <div className="mb-6">
            <ProfileEditor 
              runner={runner} 
              onUpdate={(updated) => {
                setRunner(updated);
                setShowProfileEditor(false);
              }}
              onCancel={() => setShowProfileEditor(false)}
              defaultEditing={true}
            />
          </div>
        )}

        {/* Debug: Onboarding Modal - Trigger with Cmd/Ctrl + K */}
        <OnboardingModal
          open={showDebugOnboarding}
          onOpenChange={setShowDebugOnboarding}
          runner={runner}
          leaderboardRank={leaderboardRank}
          totalRunners={totalRunners}
        />

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Current Streak */}
            <CurrentStreakCard
              streakDays={runner.current_streak_days || 0}
              streakMiles={runner.current_streak_miles || 0}
              streakStatus={runner.streak_status}
              avgMilesPerDay={runner.average_miles_per_day || 0}
            />

            {/* Days on Streak - Primary Metric */}
            <DaysOnStreakCard
              daysOnStreak30={runner.days_on_streak_last_30 || 0}
              daysOnStreak60={runner.days_on_streak_last_60 || 0}
              daysOnStreak90={runner.days_on_streak_last_90 || 0}
              daysOnStreakSinceJoining={runner.days_on_streak_since_joining || 0}
              totalDaysSinceJoining={runner.total_days_since_joining || 0}
              daysOnStreakBeforeJoining={runner.days_on_streak_before_joining || 0}
              totalDaysBeforeJoining={runner.total_days_before_joining || 0}
              joinedAt={runner.joined_runstreak_at}
            />

            {/* Streak History Section */}
            <StreakHistory runnerId={runner.id} />

            {/* Accountability Partners Section - Only on own profile */}
            {isOwnProfile && (
              <AccountabilityPartnersSection runnerId={runner.id} />
            )}

            {/* AI Analysis Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">AI Performance Insights</h2>
              <AIAnalysisCards runner={runner} />
            </div>

            {/* Best Efforts Section */}
            <BestEfforts runnerId={runner.id} />
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <RunnerActivities runnerId={id!} />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
