import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
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
  Pencil,
  Zap
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
import { StreakCountdown } from "@/components/StreakCountdown";
import { RunnerStreakStatus } from "@/components/RunnerStreakStatus";
import { Footer } from "@/components/Footer";

// Map country names to ISO 3166-1 alpha-2 codes for flags
const countryCodeMap: Record<string, string> = {
  'United States': 'us',
  'USA': 'us',
  'United Kingdom': 'gb',
  'UK': 'gb',
  'Canada': 'ca',
  'Australia': 'au',
  'Germany': 'de',
  'France': 'fr',
  'Spain': 'es',
  'Italy': 'it',
  'Netherlands': 'nl',
  'Belgium': 'be',
  'Switzerland': 'ch',
  'Austria': 'at',
  'Sweden': 'se',
  'Norway': 'no',
  'Denmark': 'dk',
  'Finland': 'fi',
  'Poland': 'pl',
  'Czech Republic': 'cz',
  'Ireland': 'ie',
  'Portugal': 'pt',
  'Greece': 'gr',
  'Japan': 'jp',
  'South Korea': 'kr',
  'China': 'cn',
  'India': 'in',
  'Brazil': 'br',
  'Mexico': 'mx',
  'Argentina': 'ar',
  'Chile': 'cl',
  'New Zealand': 'nz',
  'South Africa': 'za',
  'Singapore': 'sg',
};

const getCountryCode = (country: string): string => {
  return countryCodeMap[country] || 'un';
};

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
  const isOwnProfile = runner ? currentRunnerId === runner.id : false;
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

  // Trigger confetti when arriving from completed onboarding
  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete' && isOwnProfile) {
      const duration = 3000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FF6B35', '#F7931E', '#FDC830']
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FF6B35', '#F7931E', '#FDC830']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
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
    const fetchRunnerAndStats = async () => {
      if (!id) return;

      try {
        // Try to fetch by username first, then by ID
        let data = null;
        let error = null;

        // Check if id looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
          // Fetch by ID
          const result = await (supabase as any)
            .from("runners")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          data = result.data;
          error = result.error;
        } else {
          // Fetch by username
          const result = await (supabase as any)
            .from("runners")
            .select("*")
            .eq("username", id)
            .maybeSingle();
          data = result.data;
          error = result.error;
        }

        if (error) throw error;
        
        if (!data) {
          setIsLoading(false);
          return;
        }

        setRunner(data as Runner);
        const runnerId = data.id;

        // Now fetch follow counts using the actual runner ID
        try {
          const { count: followers } = await supabase
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", runnerId);

          const { count: following } = await supabase
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", runnerId);

          setFollowerCount(followers || 0);
          setFollowingCount(following || 0);
        } catch (error) {
          console.error("Error fetching follow counts:", error);
        }

        // Fetch leaderboard stats for onboarding modal
        try {
          const { count } = await supabase
            .from("runners")
            .select("*", { count: "exact", head: true });
          
          setTotalRunners(count || 0);

          const { data: rankData } = await supabase
            .from("runners")
            .select("id")
            .order("current_streak_days", { ascending: false });
          
          const rank = rankData?.findIndex(r => r.id === runnerId) ?? -1;
          setLeaderboardRank(rank + 1);
        } catch (error) {
          console.error("Error fetching leaderboard stats:", error);
        }
      } catch (error) {
        console.error("Error fetching runner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRunnerAndStats();
  }, [id]);

  const handleSync = async () => {
    if (!id) return;
    
    setIsSyncing(true);
    try {
      // Always do full Strava sync to fetch latest activities
      const { error } = await supabase.functions.invoke('sync-strava', {
        body: { runnerId: id }
      });
      
      if (error) throw error;
      
      // Wait for edge function to complete background work
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Auto-refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error syncing data:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to refresh your data. Please try again.",
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
          <h2 className="text-2xl font-instrument font-medium mb-4">Runner not found</h2>
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 overflow-x-hidden">
        {/* Header with Back Button and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
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
            {!isOwnProfile && runner.strava_user_id && (
              <Button 
                variant="outline"
                onClick={() => window.open(`https://www.strava.com/athletes/${runner.strava_user_id}`, '_blank')}
                className="gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                <span className="hidden sm:inline">Follow on Strava</span>
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
              <>
                <Button 
                  variant="outline" 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Strava'}</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDebugOnboarding(true)}
                  className="gap-2 border-dashed"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Test Onboarding</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <Card className="mb-6 sm:mb-8 overflow-hidden">
          <CardContent className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1 w-full min-w-0">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 flex-shrink-0">
                  <AvatarImage src={runner.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {runner.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left w-full min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-instrument font-medium mb-2 sm:mb-3 break-words">{runner.display_name}</h1>
                  
                  {runner.bio && (
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base break-words">{runner.bio}</p>
                  )}
                  
                  {(runner.city || runner.state || runner.country) && (
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-4 break-words flex items-center gap-2 justify-center sm:justify-start">
                      {runner.country && (
                        <img 
                          src={`https://flagcdn.com/16x12/${getCountryCode(runner.country)}.png`}
                          alt={runner.country}
                          className="rounded-sm"
                          width="16"
                          height="12"
                        />
                      )}
                      <span>{[runner.city, runner.state, runner.country].filter(Boolean).join(', ')}</span>
                    </p>
                  )}

                  {/* Follower/Following Counts */}
                  <div className="flex gap-4 sm:gap-6 mb-3 sm:mb-4 justify-center sm:justify-start">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">{followerCount}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">{followingCount}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProfile && (
                    <div className="flex gap-2 mb-3 sm:mb-4 flex-wrap justify-center sm:justify-start">
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
                  
                  <div className="flex flex-col gap-2 justify-center sm:justify-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={streakActive ? "default" : "secondary"} className="w-fit">
                        {streakActive ? (
                          <>
                            <Flame className="h-4 w-4 mr-1" />
                            {runner.current_streak_days} {runner.current_streak_days === 1 ? 'Day' : 'Days'} Streak
                          </>
                        ) : (
                          "No Active Streak"
                        )}
                      </Badge>
                      
                      {!isOwnProfile && runner.timezone && streakActive && (
                        <RunnerStreakStatus 
                          lastActivityDate={runner.last_activity_date}
                          timezone={runner.timezone}
                          country={runner.country}
                        />
                      )}
                    </div>
                    
                    {runner.joined_runstreak_at && (
                      <div className="text-xs text-muted-foreground">
                        RunStreak member since {new Date(runner.joined_runstreak_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-auto lg:max-w-[420px] overflow-hidden flex-shrink-0 min-w-0">
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
            {/* Streak Countdown - Only on own profile */}
            {isOwnProfile && <StreakCountdown lastActivityDate={runner.last_activity_date} timezone={runner.timezone || 'America/Los_Angeles'} variant="profile" />}
            
            {/* Current Streak */}
            <CurrentStreakCard
              streakDays={runner.current_streak_days || 0}
              streakMiles={runner.current_streak_miles || 0}
              streakStatus={runner.streak_status}
              avgMilesPerDay={runner.average_miles_per_day || 0}
              streakStartDate={runner.streak_start_date}
              lastActivityDate={runner.last_activity_date}
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
              <h2 className="text-xl font-instrument font-medium mb-4">AI Performance Insights</h2>
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
      
      <Footer />
    </div>
  );
}
