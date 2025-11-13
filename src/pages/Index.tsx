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
import { AddStartupModal } from "@/components/AddStartupModal";
import { AdvertiseModal } from "@/components/AdvertiseModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SponsorCarousel } from "@/components/SponsorCarousel";
import { DesktopAdSidebar } from "@/components/DesktopAdSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types";
import { Plus, HandHeart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ShinyText from "@/components/ui/shiny-text";
import impactMascot from "@/assets/impact-mascot.png";
import jamesCitron from "@/assets/james-citron.png";

type LeaderboardView = "total" | "percent";

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<LeaderboardView>("total");
  const [displayCount, setDisplayCount] = useState(10);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("total_donated", { ascending: false });

      if (error) throw error;
      setCompanies((data || []) as Company[]);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: "Failed to load startups. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const displayedCompanies = companies.slice(0, displayCount);
  const hasMore = displayCount < companies.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Ad Sidebars */}
      <DesktopAdSidebar side="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />
      <DesktopAdSidebar side="right" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      {/* Top Carousel (Mobile only) */}
      <SponsorCarousel direction="left" onAdvertiseClick={() => setIsAdvertiseModalOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-[240px] py-12">
        {/* Header */}
        <header className="text-center mb-10 px-0 sm:px-4">
          <div className="flex items-center justify-center mb-3">
            <h1 className="text-3xl font-instrument-serif font-normal flex items-center gap-2">
              <HandHeart 
                className="h-7 w-7 animate-shiny-text" 
                style={{
                  stroke: 'url(#gradient-logo)',
                  fill: 'none',
                  strokeWidth: 2
                }}
              />
              <ShinyText text="ImpactProof" speed={5} />
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <linearGradient id="gradient-logo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(45 100% 60%)" />
                    <stop offset="100%" stopColor="hsl(35 100% 50%)" />
                  </linearGradient>
                </defs>
              </svg>
            </h1>
          </div>
          <h2 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-instrument font-medium mb-2.5 tracking-tight leading-[1.15] px-2 sm:px-0">
            The verified leaderboard
            <br />
            of startup giving
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-inter font-light leading-relaxed">
            {view === "percent" 
              ? "Verified percentage of revenue donated by each startup."
              : "Every startup claims they donate. Now they can prove it."}
          </p>
        </header>

        {/* Actions */}
        <div className="mb-8">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add startup
            </Button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-base sm:text-2xl font-bold">Leaderboard</h3>
              <Tabs value={view} onValueChange={(v) => setView(v as LeaderboardView)}>
                <TabsList>
                  <TabsTrigger value="total">Total Donations</TabsTrigger>
                  <TabsTrigger value="percent">% Donated</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select defaultValue="total">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total donated</SelectItem>
                  <SelectItem value="arr">ARR donated</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading startups...
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No startups yet. Be the first to add yours!
            </div>
          ) : (
            <>
              <LeaderboardTable companies={displayedCompanies} view={view} />
              
              {hasMore && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setDisplayCount(prev => Math.min(prev + 10, companies.length))}
                    className="min-w-[200px]"
                  >
                    Show more ({companies.length - displayCount} more startups)
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
              All donation and revenue data are verified through Pledge and Stripe API keys. Data is updated hourly.
            </p>
          </div>
        </div>

        {/* Illustration Section */}
        <div className="py-16 px-4">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <img
                src={impactMascot}
                alt="ImpactProof mascot"
                className="h-48 w-48 object-contain"
              />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-instrument font-medium text-center tracking-tight max-w-4xl mb-8">
              The verified leaderboard of startup giving
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
                  placeholder="Search startups, founders, categories..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="gap-2 whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                Add startup
              </Button>
            </div>
          </div>
        </div>

      </div>

      <AddStartupModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchCompanies}
      />

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
            Origin Story
          </h2>
          
          {/* Story Paragraph */}
          <div className="text-base sm:text-lg text-foreground/90 leading-relaxed space-y-4 mb-12">
            <p>
              Following{" "}
              <a href="https://x.com/marc_louvion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors">
                <img 
                  src="https://unavatar.io/twitter/marc_louvion" 
                  alt="Marc Lou"
                  className="inline-block w-5 h-5 rounded-full"
                />
                Marc Lou's
              </a>{" "}
              <a href="https://trustmrr.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-medium transition-colors">
                TrustMRR
              </a>{" "}
              saga on X for days, watching the build in public unfold. One night I studied his YouTube video breaking down the lean leaderboard approach.
            </p>
            
            <p>
              Next morning, new BAMF client{" "}
              <a href="https://linkedin.com/in/jamescitron" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors">
                <img 
                  src={jamesCitron} 
                  alt="James Citron"
                  className="inline-block w-5 h-5 rounded-full object-cover"
                />
                James Citron
              </a>{" "}
              hops on our onboarding call and describes{" "}
              <a href="https://pledge.to" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Pledge.to
              </a>{" "}
              as "the Stripe of giving"—$200M+ raised, every donation API-verified.
            </p>
            
            <p className="text-xl font-semibold text-foreground">
              Instant lightbulb.
            </p>
            
            <p>
              Marc's design + Pledge's API = solution to a problem I've been sitting on for years. Companies claim impact. Nobody verifies it. This needed to exist.
            </p>
            
            <p>
              Built it that weekend. Couldn't stop thinking about it.
            </p>
          </div>

          {/* Visual Formula */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 py-8 bg-muted/30 rounded-lg border border-border/50">
            {/* TrustMRR Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                <img 
                  src="https://www.google.com/s2/favicons?domain=trustmrr.com&sz=64" 
                  alt="TrustMRR"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">TrustMRR</span>
            </div>

            {/* Plus Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">+</span>

            {/* Pledge.to Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                <img 
                  src="https://www.google.com/s2/favicons?domain=pledge.to&sz=64" 
                  alt="Pledge.to"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">Pledge.to</span>
            </div>

            {/* Equals Symbol */}
            <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">=</span>

            {/* ImpactProof Logo */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                <HandHeart 
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
                      <stop offset="0%" stopColor="hsl(45 100% 60%)" />
                      <stop offset="100%" stopColor="hsl(35 100% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">ImpactProof</span>
            </div>
          </div>
        </div>
      </div>

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
              </ul>
            </div>

            {/* Browse startups */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Browse startups</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    All Startups
                  </a>
                </li>
              </ul>
            </div>

            {/* From the maker */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">From the maker of ImpactProof</h3>
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
                    Bamf.ai
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Built by{" "}
                <a
                  href="https://x.com/houstonhgolden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Houston Golden
                </a>
              </span>
              <span>•</span>
              <button
                onClick={() => setIsAdvertiseModalOpen(true)}
                className="hover:text-foreground transition-colors"
              >
                Advertise
              </button>
              <span>•</span>
              <span>
                Powered by{" "}
                <a
                  href="https://pledge.to"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Pledge.to
                </a>
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
