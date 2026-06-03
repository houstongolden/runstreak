import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { AdvertiseModal } from "@/components/AdvertiseModal";
import { SponsorCarousel } from "@/components/SponsorCarousel";
import { DesktopAdSidebar } from "@/components/DesktopAdSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Plus } from "lucide-react";
import runstreaksLogo from "@/assets/runstreaks-logo.png";
import { toast } from "@/hooks/use-toast";
import ShinyText from "@/components/ui/shiny-text";

import { AppDownloadSection } from "@/components/AppDownloadSection";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { AnimatedHeatmap } from "@/components/AnimatedHeatmap";
import { AnimatedLeaderboard } from "@/components/AnimatedLeaderboard";
import AnimatedAIChat from "@/components/AnimatedAIChat";
import heroRunningBg from "@/assets/hero-running-bg.png";
import heroDarkBg from "@/assets/hero-dark-bg.jpg";
import { Footer } from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user, runnerId } = useAuth();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingRunner, setOnboardingRunner] = useState<Runner | null>(null);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [isStravaConnecting, setIsStravaConnecting] = useState(false);
  const [sortBy, setSortBy] = useState<"streak" | "miles" | "pace">("streak");
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "60d" | "90d" | "6mo" | "ytd" | "1yr" | "all">("7d");

  const handleStravaConnect = async () => {
    try {
      setIsStravaConnecting(true);
      
      // Capture referral code from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref') || '';
      
      // Store in localStorage for callback
      if (referralCode) {
        localStorage.setItem('referralCode', referralCode);
      }
      
      const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { referralCode }
      });
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Strava. Please try again.",
        variant: "destructive",
      });
      setIsStravaConnecting(false);
    }
  };

  const fetchRunners = async () => {
    try {
      console.log("Fetching runners with filters:", { sortBy, timePeriod });
      
      // Calculate date range for time period filter
      const now = new Date();
      let startDate: string;
      
      switch (timePeriod) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "60d":
          startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "6mo":
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "ytd":
          startDate = `${now.getFullYear()}-01-01`;
          break;
        case "1yr":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case "all":
          startDate = "1970-01-01"; // Beginning of time for all-time stats
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Fetch runners with their base data
      const { data: runnersData, error: runnersError } = await supabase
        .from("runners")
        .select("*");

      if (runnersError) throw runnersError;

      // Fetch aggregated activity data for the time period
      const { data: activityData, error: activityError } = await supabase
        .from("daily_activities")
        .select("runner_id, distance, moving_time")
        .gte("activity_date", startDate);

      if (activityError) throw activityError;

      // Aggregate activity data by runner
      const activityStats = (activityData || []).reduce((acc: any, activity: any) => {
        if (!acc[activity.runner_id]) {
          acc[activity.runner_id] = { totalDistance: 0, totalTime: 0 };
        }
        acc[activity.runner_id].totalDistance += activity.distance || 0;
        acc[activity.runner_id].totalTime += activity.moving_time || 0;
        return acc;
      }, {});

      // Combine runner data with activity stats and calculate pace
      const enrichedRunners = (runnersData || []).map((runner: any) => {
        const stats = activityStats[runner.id] || { totalDistance: 0, totalTime: 0 };
        const distanceInMiles = stats.totalDistance / 1609.34;
        const timeInMinutes = stats.totalTime / 60;
        const pace = distanceInMiles > 0 ? timeInMinutes / distanceInMiles : 999999; // min/mile
        
        return {
          ...runner,
          period_distance: distanceInMiles,
          period_pace: pace,
        };
      });

      // Sort based on selected metric
      let sorted = [...enrichedRunners];
      if (sortBy === "miles") {
        sorted.sort((a, b) => b.period_distance - a.period_distance);
      } else if (sortBy === "pace") {
        sorted.sort((a, b) => a.period_pace - b.period_pace); // Lower pace is better
      } else {
        sorted.sort((a, b) => b.current_streak_days - a.current_streak_days);
      }

      console.log(`Fetched ${sorted.length} runners with period stats`);
      setRunners(sorted as Runner[]);
    } catch (error) {
      console.error("Error fetching runners:", error);
      toast({
        title: "Error",
        description: "Failed to load runners. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdsEnabled = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'ads_enabled')
        .maybeSingle();

      if (error) throw error;
      setAdsEnabled(data?.setting_value === true);
    } catch (error) {
      console.error('Error fetching ads setting:', error);
      setAdsEnabled(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchRunners();
      await fetchAdsEnabled();
      
      // Check if user is returning from Strava OAuth with session tokens
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const stravaStatus = searchParams.get('strava');
      const urlRunnerId = searchParams.get('runnerId');
      const showWelcome = searchParams.get('welcome');

      // Handle magiclink authentication (from Strava OAuth callback)
      if (tokenHash && type) {
        console.log('[Index] Verifying magiclink token...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });
        
        if (error) {
          console.error('[Index] Magiclink verification error:', error);
          toast({
            title: "Authentication Failed",
            description: "Failed to sign in. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log('[Index] Magiclink verified, session established');
          toast({
            title: "Welcome Back!",
            description: "Successfully signed in to your account.",
          });
        }
        
        // Clean up URL
        window.history.replaceState({}, '', '/');
        return;
      }

      // Handle returning user authentication (legacy method)
      if (accessToken && refreshToken) {
        console.log('[Index] Setting up session for returning user...');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('[Index] Session setup error:', error);
          toast({
            title: "Authentication Failed",
            description: "Failed to sign in. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log('[Index] Session established');
          toast({
            title: "Welcome Back!",
            description: "Successfully signed in to your account.",
          });
        }
        
        // Clean up URL
        window.history.replaceState({}, '', '/');
        return;
      }
      
      if (stravaStatus === 'success' && urlRunnerId && showWelcome === 'true') {
        // Fetch the runner data for onboarding
        try {
          const { data, error } = await supabase
            .from("runners")
            .select("*")
            .eq("id", urlRunnerId)
            .maybeSingle();
          
          if (!error && data) {
            setOnboardingRunner(data as any);
            // Calculate rank
            const { data: allRunners } = await supabase
              .from("runners")
              .select("id, current_streak_days")
              .order("current_streak_days", { ascending: false });
            
            const rank = (allRunners || []).findIndex(r => r.id === urlRunnerId) + 1;
            setLeaderboardRank(rank);
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error fetching runner for onboarding:", error);
        }
        
        // Clean up URL
        window.history.replaceState({}, '', '/');
      } else if (stravaStatus === 'success' && urlRunnerId) {
        toast({
          title: "Connected!",
          description: "Successfully connected to Strava.",
        });
        window.history.replaceState({}, '', '/');
      } else if (stravaStatus === 'error') {
        const message = searchParams.get('message');
        toast({
          title: "Connection Failed",
          description: message || "Failed to connect to Strava.",
          variant: "destructive",
        });
        window.history.replaceState({}, '', '/');
      }
    };
    
    loadData();
  }, [navigate, toast]);

  // Refetch when filters change
  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true);
      fetchRunners();
    }
  }, [sortBy, timePeriod]);

  const displayedRunners = runners.slice(0, displayCount);
  const hasMore = displayCount < runners.length;

  return (
    <AppLayout>
      <Helmet>
        <title>RunStreaks - The Verified Leaderboard for Daily Runners</title>
        <meta name="description" content="Track your daily running streak on the verified leaderboard. Connect your Strava, prove you run every day, and compete with dedicated runners worldwide." />
        <meta property="og:title" content="RunStreaks - Daily Running Leaderboard" />
        <meta property="og:description" content="Connect your Strava. Prove you run every day. Join the leaderboard of dedicated runners keeping their streak alive." />
        <meta property="og:url" content="https://runstreaks.io/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="RunStreaks - Daily Running Leaderboard" />
        <meta name="twitter:description" content="Track your running streak and compete with runners worldwide on the verified leaderboard." />
        <link rel="canonical" href="https://runstreaks.io/" />
      </Helmet>
      <div className="min-h-screen dark:bg-background">
        {/* Desktop Ad Sidebars */}
        {adsEnabled && (
          <>
            <DesktopAdSidebar side="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
            <DesktopAdSidebar side="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
          </>
        )}

        {/* Top Carousel (Mobile only) */}
        {adsEnabled && <SponsorCarousel direction="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />}

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 xl:px-24 py-6 sm:py-12">
        {/* Light mode hero background with overlay and fade */}
        {/* Light mode hero background - Video */}
        <div className="absolute left-0 right-0 top-0 h-[600px] overflow-hidden light:block dark:hidden pointer-events-none -z-10">
          <video 
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.playbackRate = 0.5;
                el.play().catch(() => {
                  // Autoplay blocked, try again on first user interaction
                  const playOnInteraction = () => {
                    el.play().catch(() => {});
                    document.removeEventListener('click', playOnInteraction);
                  };
                  document.addEventListener('click', playOnInteraction);
                });
              }
            }}
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={heroRunningBg}
          >
            <source src="/videos/hero-running-bg.mp4" type="video/mp4" />
          </video>
          {/* White overlay */}
          <div className="absolute inset-0 bg-white/80" />
          {/* Bottom fade to white */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Light mode hero background - Image backup (commented out, keep for easy revert) */}
        {/* <div className="absolute left-0 right-0 top-0 h-[600px] overflow-hidden light:block dark:hidden pointer-events-none -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroRunningBg})` }}
          />
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div> */}

        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 px-2 sm:px-4 relative z-10">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-logo font-semibold flex items-center uppercase" style={{ gap: '0.15em' }}>
              <img 
                src={runstreaksLogo} 
                alt="RunStreaks Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 object-contain transition-all duration-300 hover:animate-logo-glow hover:scale-110"
                style={{
                  filter: 'drop-shadow(0 0 15px hsl(16 100% 50% / 0.6)) drop-shadow(0 0 25px hsl(16 100% 50% / 0.4))'
                }}
              />
              <span style={{ transform: 'skewX(-6deg)', letterSpacing: '0.01em' }}>
                <ShinyText text="RUNSTREAKS" speed={8} />
              </span>
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold mb-4 sm:mb-5 tracking-tight leading-tight px-1 sm:px-0">
            The verified leaderboard for runners<br className="hidden sm:block" /> keeping their streak alive
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect your Strava. Run at least 1 mile per day. Keep your streak alive.
          </p>
        </header>

        {/* Actions */}
        {!user && (
          <div className="mb-10 sm:mb-12">
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={handleStravaConnect}
                disabled={isStravaConnecting}
                size="lg"
                className="gap-2.5 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <img 
                  src="https://www.google.com/s2/favicons?domain=strava.com&sz=32" 
                  alt="Strava" 
                  className="h-5 w-5 sm:h-6 sm:w-6" 
                />
                Connect with Strava
              </Button>
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
        {user && runnerId && (
          <div className="mb-10 sm:mb-12">
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => navigate(`/runner/${runnerId}`)}
                size="lg"
                variant="default"
                className="gap-2.5 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                View My Profile
              </Button>
            </div>
          </div>
        )}

        {/* Leaderboard Section */}
        <div className="mb-6 px-4 sm:px-6">
          <div className="rounded-lg border-0 bg-card/80 backdrop-blur-[40px] p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4 sm:mb-5">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-10 text-sm border border-border/40 bg-muted/30 backdrop-blur-[32px] hover:bg-muted/40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover backdrop-blur-[32px] border-0 z-50">
                  <SelectItem value="streak">Active streaks</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-10 text-sm border border-border/40 bg-muted/30 backdrop-blur-[32px] hover:bg-muted/40">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent className="bg-popover backdrop-blur-[32px] border-0 z-50">
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                  <SelectItem value="60d">60d</SelectItem>
                  <SelectItem value="90d">90d</SelectItem>
                  <SelectItem value="6mo">6m</SelectItem>
                  <SelectItem value="ytd">YTD</SelectItem>
                  <SelectItem value="1yr">12m</SelectItem>
                  <SelectItem value="all">All-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-16 sm:py-20 text-muted-foreground text-base sm:text-lg">
                Loading runners...
              </div>
            ) : runners.length === 0 ? (
              <div className="text-center py-16 sm:py-20 text-muted-foreground text-base sm:text-lg">
                No runners yet. Be the first to add yours!
              </div>
            ) : (
              <>
                <LeaderboardTable runners={displayedRunners} view="total" sortBy={sortBy} />
                
                 {hasMore && (
                   <div className="mt-5 flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      onClick={() => setDisplayCount(prev => Math.min(prev + 10, runners.length))}
                      className="min-w-[200px]"
                    >
                      Show more ({runners.length - displayCount} more runners)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Verification Message */}
        <div className="py-4 px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <svg
              className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="text-sm">
              All streak and mileage data are verified through Strava API integration. Data syncs automatically within minutes of completing your run.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 px-4">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="text-6xl sm:text-9xl tracking-[-0.5em] sm:tracking-[-0.4em] -ml-3 sm:-ml-4">🏃🏾‍♂️🏃🏼‍♀️🏃🏻‍♂️</div>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-instrument font-medium text-center tracking-tight max-w-4xl mb-8">
              Prove your streak.<br />Compete with runners worldwide.
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl w-full">
              <div className="relative flex-1 w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search runners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="w-full pl-10 pr-14 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                    searchQuery.trim() 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-muted/50'
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${searchQuery.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <AdvertiseModal
        open={isAdvertiseModalOpen}
        onOpenChange={setIsAdvertiseModalOpen}
      />

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 xl:px-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-instrument font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the community, track your streak, and stay accountable—automatically synced with Strava.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1: Connect with Strava */}
            <div className="group relative" style={{ animationDelay: '0ms' }}>
              <div className="h-full p-8 rounded-lg bg-card/60 backdrop-blur-[40px] border-0 hover:bg-card/80 transition-all duration-300 animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-instrument font-semibold text-foreground mb-3">
                  Connect with Strava
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Connect with Strava and it will automatically sync your running activities, calculate your current streak, and show you on the leaderboard.
                </p>
                <Button
                  onClick={handleStravaConnect}
                  disabled={isStravaConnecting}
                  size="lg"
                  className="w-full"
                >
                  <img 
                    src="https://www.google.com/s2/favicons?domain=strava.com&sz=32" 
                    alt="Strava" 
                    className="mr-2 h-5 w-5" 
                  />
                  {isStravaConnecting ? 'Connecting...' : 'Connect with Strava'}
                </Button>
              </div>
            </div>

            {/* Step 2: Compete on the Leaderboard */}
            <div className="group relative" style={{ animationDelay: '150ms' }}>
              <div className="h-full p-8 rounded-lg bg-card/60 backdrop-blur-[40px] border-0 hover:bg-card/80 transition-all duration-300 animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-instrument font-semibold text-foreground mb-3">
                  Compete on the Leaderboard
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Watch your rank climb as you maintain your streak and compete with runners worldwide.
                </p>
                <AnimatedLeaderboard />
              </div>
            </div>

            {/* Step 3: Track Your Progress */}
            <div className="group relative" style={{ animationDelay: '300ms' }}>
              <div className="h-full p-8 rounded-lg bg-card/60 backdrop-blur-[40px] border-0 hover:bg-card/80 transition-all duration-300 animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-instrument font-semibold text-foreground mb-3">
                  Track Your Progress
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  View your activity heatmap and best efforts. Run at least 1 mile per day to maintain your streak.
                </p>
                <AnimatedHeatmap />
              </div>
            </div>

            {/* Step 4: Stay Accountable */}
            <div className="group relative" style={{ animationDelay: '450ms' }}>
              <div className="h-full p-8 rounded-lg bg-card/60 backdrop-blur-[40px] border-0 hover:bg-card/80 transition-all duration-300 animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
                    4
                  </div>
                </div>
                <h3 className="text-2xl font-instrument font-semibold text-foreground mb-3">
                  Stay Accountable
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Never miss a day with our accountability tools designed to keep your streak alive.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Countdown Clock</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Real-time timer showing hours until your streak breaks</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 hover:bg-background/70 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground">SMS Reminders</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Daily text messages to remind you to complete your mile</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      <AdvertiseModal 
        open={isAdvertiseModalOpen} 
        onOpenChange={setIsAdvertiseModalOpen}
      />

      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        runner={onboardingRunner}
        leaderboardRank={leaderboardRank}
        totalRunners={runners.length}
      />

      {/* Bottom Carousel (Mobile only) - Below Footer */}
      <SponsorCarousel direction="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      </div>
    </AppLayout>
  );
};

export default Index;
