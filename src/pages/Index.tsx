import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { AdvertiseModal } from "@/components/AdvertiseModal";
import { SponsorCarousel } from "@/components/SponsorCarousel";
import { DesktopAdSidebar } from "@/components/DesktopAdSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Plus, Flame } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ShinyText from "@/components/ui/shiny-text";

import { AggregateStatsCard } from "@/components/AggregateStatsCard";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";

type LeaderboardView = "total" | "percent" | "fiveday";

const Index = () => {
  const navigate = useNavigate();
  const { user, runnerId } = useAuth();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<LeaderboardView>("total");
  const [displayCount, setDisplayCount] = useState(10);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingRunner, setOnboardingRunner] = useState<Runner | null>(null);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [adsEnabled, setAdsEnabled] = useState(false);

  const fetchRunners = async () => {
    try {
      console.log("Fetching runners...");
      const { data, error } = await (supabase as any)
        .from("runners")
        .select("*")
        .order("current_streak_days", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} runners:`, data);
      setRunners((data || []) as Runner[]);
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
      
      // Check if user is already connected to Strava and handle success callback
      const searchParams = new URLSearchParams(window.location.search);
      const stravaStatus = searchParams.get('strava');
      const urlRunnerId = searchParams.get('runnerId');
      const showWelcome = searchParams.get('welcome');
      
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

  const displayedRunners = runners.slice(0, displayCount);
  const hasMore = displayCount < runners.length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Desktop Ad Sidebars */}
        {adsEnabled && (
          <>
            <DesktopAdSidebar side="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
            <DesktopAdSidebar side="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
          </>
        )}

        {/* Top Carousel (Mobile only) */}
        {adsEnabled && <SponsorCarousel direction="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 px-2 sm:px-4">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-instrument-serif font-normal flex items-center gap-2.5 sm:gap-3">
              <Flame 
                className="h-7 w-7 sm:h-9 sm:w-9 lg:h-10 lg:w-10 animate-shiny-text"
                style={{
                  stroke: 'url(#gradient-logo)',
                  fill: 'none',
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 0 12px hsl(22 93% 55% / 0.6)) drop-shadow(0 0 20px hsl(22 93% 55% / 0.3))'
                }}
              />
              <span style={{ marginLeft: '-12px' }}>
                <ShinyText text="RunStreak" speed={8} />
              </span>
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="gradient-logo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(25 100% 60%)" />
                    <stop offset="100%" stopColor="hsl(15 100% 50%)" />
                  </linearGradient>
                </defs>
              </svg>
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-instrument font-semibold mb-4 sm:mb-5 tracking-tight leading-tight px-1 sm:px-0">
            The verified leaderboard for runners<br className="hidden sm:block" /> keeping their streak alive
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-inter leading-relaxed">
            Connect your Strava. Run at least 1 mile per day. Keep your streak alive. <span className="font-semibold text-foreground">100% Free.</span>
          </p>
        </header>

        {/* Actions */}
        {!user && (
          <div className="mb-10 sm:mb-12">
            <div className="flex justify-center">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="gap-2.5 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
                Connect with Strava
              </Button>
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
        <div className="mb-6 px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8">
            <Tabs value={view} onValueChange={(v) => setView(v as LeaderboardView)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:flex h-11 sm:h-10">
                <TabsTrigger value="total" className="text-xs sm:text-sm">Daily Streaks</TabsTrigger>
                <TabsTrigger value="fiveday" className="text-xs sm:text-sm">5-Day Week</TabsTrigger>
                <TabsTrigger value="percent" className="text-xs sm:text-sm">Most Miles</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select defaultValue="streak">
              <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-10 text-sm border-border bg-background hover:bg-muted/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streak">Longest streak</SelectItem>
                <SelectItem value="miles">Most miles</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-10 text-sm border-border bg-background hover:bg-muted/50">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="year">This year</SelectItem>
                <SelectItem value="month">This month</SelectItem>
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
              <LeaderboardTable runners={displayedRunners} view={view} />
              
              {hasMore && (
                <div className="mt-8 flex flex-col items-center gap-4">
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

        {/* Verification Message */}
        <div className="py-8 px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <svg
              className="h-5 w-5"
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
              All streak and mileage data are verified through Strava API integration. Data is updated daily.
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

      {/* Aggregate Stats */}
      <AggregateStatsCard />

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <footer className="border-t border-border pt-12 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[280px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Explore */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    Global Leaderboard
                  </a>
                </li>
                <li>
                  <a href="/features" className="hover:text-foreground transition-colors">
                    Platform Features
                  </a>
                </li>
                <li>
                  <a href="/philosophy" className="hover:text-foreground transition-colors">
                    The Run Streak Philosophy
                  </a>
                </li>
                <li>
                  <a href="/badge-docs" className="hover:text-foreground transition-colors">
                    Embed Your Badge
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    View All Streakers
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">About RunStreak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/story" className="hover:text-foreground transition-colors">
                    Our Origin Story
                  </a>
                </li>
                <li>
                  <a
                    href="https://bamf.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Built by BAMF
                  </a>
                </li>
              </ul>
            </div>

            {/* Partner With Us */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Partner With Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => setIsAdvertiseModalOpen(true)}
                    className="hover:text-foreground transition-colors text-left"
                  >
                    Advertise
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RunStreak. Built by{" "}
              <a
                href="https://bamf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                BAMF
              </a>
              .
            </p>
          </div>
        </div>
      </footer>

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
