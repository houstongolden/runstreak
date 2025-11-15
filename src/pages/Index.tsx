import { useState, useEffect } from "react";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { SponsorCarousel } from "@/components/SponsorCarousel";
import { DesktopAdSidebar } from "@/components/DesktopAdSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Runner } from "@/types";
import { Plus, Flame } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ShinyText from "@/components/ui/shiny-text";
import { RunStreakPhilosophy } from "@/components/RunStreakPhilosophy";
import { AggregateStatsCard } from "@/components/AggregateStatsCard";
import { AppDownloadSection } from "@/components/AppDownloadSection";

type LeaderboardView = "total" | "percent" | "fiveday";

const Index = () => {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<LeaderboardView>("total");
  const [displayCount, setDisplayCount] = useState(10);
  const [isConnected, setIsConnected] = useState(false);

  const fetchRunners = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("runners")
        .select("*")
        .order("current_streak_days", { ascending: false });

      if (error) throw error;
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

  useEffect(() => {
    fetchRunners();
    
    // Check if user is already connected to Strava
    const runnerId = localStorage.getItem('runnerId');
    if (runnerId) {
      setIsConnected(true);
    }
  }, []);

  const displayedRunners = runners.slice(0, displayCount);
  const hasMore = displayCount < runners.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Ad Sidebars */}
      <DesktopAdSidebar side="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
      <DesktopAdSidebar side="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      {/* Top Carousel (Mobile only) */}
      <SponsorCarousel direction="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 lg:px-[240px] py-6 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 px-2 sm:px-4">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-instrument-serif font-normal flex items-center gap-2.5 sm:gap-3">
              <Flame 
                className="h-7 w-7 sm:h-9 sm:w-9 lg:h-10 lg:w-10 animate-shiny-text"
                style={{
                  stroke: 'url(#gradient-logo)',
                  fill: 'none',
                  strokeWidth: 2
                }}
              />
              <ShinyText text="RunStreak" speed={5} />
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
            Connect your Strava. Prove you run every day. Join the leaderboard.
          </p>
        </header>

        {/* Actions */}
        {!isConnected ? (
          <div className="mb-10 sm:mb-12">
            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = '/connect'}
                size="lg"
                className="gap-2.5 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
                Connect with Strava
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-10 sm:mb-12">
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  const runnerId = localStorage.getItem('runnerId');
                  if (runnerId) {
                    window.location.href = `/runner/${runnerId}`;
                  }
                }}
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
        <div className="mb-6">
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
              <div className="text-9xl tracking-[-0.5em]">🏃🏻‍♂️🏃🏼‍♀️</div>
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
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <AdvertiseModal
        open={isAdvertiseModalOpen}
        onOpenChange={setIsAdvertiseModalOpen}
      />

      {/* Bottom Carousel (Mobile only) */}
      <SponsorCarousel direction="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      {/* Origin Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[240px] py-16 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-instrument font-medium text-center mb-10 tracking-tight">
            Why RunStreak Exists
          </h2>
          
          {/* Story Paragraph */}
          <div className="text-base sm:text-lg text-foreground/90 leading-relaxed space-y-4 mb-12">
            <p>
              Every runner knows someone who claims they "never miss a day." The problem? There's no way to verify it.
            </p>
            
            <p>
              Strava tracks every run, but doesn't showcase commitment. Reddit's r/amileaday community shares screenshots, but it's all manual and unverified.
            </p>
            
            <p className="text-xl font-semibold text-foreground">
              RunStreak fixes this.
            </p>
            
            <p>
              Connect your Strava account. We automatically verify your daily running streak and display it on a public leaderboard. No screenshots. No manual logging. Just pure, verified commitment.
            </p>
            
            <p>
              Built for runners who don't just talk about consistency—they prove it every single day.
            </p>
          </div>

          {/* Visual Formula */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 py-8 bg-muted/30 rounded-lg border border-border/50">
            {/* Strava Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                <img 
                  src="https://www.google.com/s2/favicons?domain=strava.com&sz=64" 
                  alt="Strava"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">Strava API</span>
            </div>

            {/* Plus Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">+</span>

            {/* Daily Verification */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
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
              </div>
              <span className="text-xs text-muted-foreground">Verification</span>
            </div>

            {/* Equals Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">=</span>

            {/* RunStreak Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                <Flame 
                  className="h-6 w-6 sm:h-8 sm:w-8" 
                  style={{
                    stroke: 'url(#gradient-formula)',
                    fill: 'none',
                    strokeWidth: 2
                  }}
                />
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="gradient-formula" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(25 100% 60%)" />
                      <stop offset="100%" stopColor="hsl(15 100% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">RunStreak</span>
            </div>
          </div>
        </div>
      </div>

      {/* RunStreak Philosophy Section */}
      <RunStreakPhilosophy />

      {/* Aggregate Stats */}
      <AggregateStatsCard />

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <footer className="border-t border-border pt-12 pb-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[240px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Navigation */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Navigation</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a href="/badge-docs" className="hover:text-foreground transition-colors">
                    Badge Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Browse Runners */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Browse Runners</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    All Runners
                  </a>
                </li>
              </ul>
            </div>

            {/* From the maker */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">From the maker of RunStreak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://bamf.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    BAMF.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://bamf.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    BAMF.ai
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
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

      {/* Theme Toggle - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Index;
