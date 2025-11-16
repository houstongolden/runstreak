import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, TrendingUp, Users, Loader2, Flame, Award, Zap, Search } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { FollowButton } from "@/components/FollowButton";
import { AccountabilityPartnerButton } from "@/components/AccountabilityPartnerButton";
import { useAuth } from "@/contexts/AuthContext";
import ShinyText from "@/components/ui/shiny-text";
import { Input } from "@/components/ui/input";

type Runner = Tables<"runners">;

export default function Discover() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const { runnerId: currentRunnerId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");

  useEffect(() => {
    fetchRunners();
  }, []);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  const fetchRunners = async () => {
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
      setLoading(false);
    }
  };

  const getNearbyRunners = () => {
    if (!currentRunnerId) return [];
    const currentRunner = runners.find(r => r.id === currentRunnerId);
    if (!currentRunner?.city) return [];
    
    return runners.filter(r => 
      r.city === currentRunner.city
    );
  };

  const getSimilarPaceRunners = () => {
    if (!currentRunnerId) return [];
    const currentRunner = runners.find(r => r.id === currentRunnerId);
    if (!currentRunner?.average_miles_per_day) return [];
    
    const currentPace = currentRunner.average_miles_per_day;
    return runners
      .filter(r => r.average_miles_per_day)
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
      .sort((a, b) => (b.current_streak_days || 0) - (a.current_streak_days || 0))
      .slice(0, 20);
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return runners;
    
    const query = searchQuery.toLowerCase();
    return runners.filter(r => 
      r.display_name.toLowerCase().includes(query) ||
      r.strava_username.toLowerCase().includes(query) ||
      r.username?.toLowerCase().includes(query) ||
      r.city?.toLowerCase().includes(query) ||
      r.state?.toLowerCase().includes(query)
    );
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{runner.display_name}</h3>
              {runner.streak_status === 'active' && (
                <Badge variant="default" className="bg-primary">
                  {runner.current_streak_days}d streak
                </Badge>
              )}
            </div>
            {runner.city && runner.state && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{runner.city}, {runner.state}</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>{(runner.average_miles_per_day || 0).toFixed(1)} mi/day avg</span>
              <span>{runner.all_time_run_count || 0} runs</span>
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {currentRunnerId && (
                <>
                  <FollowButton 
                    targetRunnerId={runner.id}
                    currentRunnerId={currentRunnerId} 
                  />
                  <AccountabilityPartnerButton
                    targetRunnerId={runner.id}
                    targetRunnerName={runner.display_name}
                    currentRunnerId={currentRunnerId}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Runners</h1>
        <p className="text-muted-foreground">Find runners near you and with similar goals</p>
        
        {/* Search Bar */}
        <div className="mt-6 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, username, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3"
          />
        </div>
      </div>

      <Tabs defaultValue={searchQuery ? "search" : "nearby"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          {searchQuery && (
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search Results
            </TabsTrigger>
          )}
          <TabsTrigger value="nearby" className="gap-2">
            <MapPin className="h-4 w-4" />
            Nearby
          </TabsTrigger>
          <TabsTrigger value="similar" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Similar Pace
          </TabsTrigger>
          <TabsTrigger value="leaders" className="gap-2">
            <Users className="h-4 w-4" />
            Streak Leaders
          </TabsTrigger>
        </TabsList>

        {searchQuery && (
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Results for "{searchQuery}"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSearchResults().length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No runners found matching your search
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Found {getSearchResults().length} {getSearchResults().length === 1 ? 'runner' : 'runners'}
                    </p>
                    {getSearchResults().map(runner => (
                      <RunnerCard key={runner.id} runner={runner} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="nearby" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Runners in Your Area</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getNearbyRunners().length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No runners found in your area yet
                </p>
              ) : (
                getNearbyRunners().map(runner => (
                  <RunnerCard key={runner.id} runner={runner} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="similar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Runners with Similar Pace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSimilarPaceRunners().length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No runners found with similar pace yet
                </p>
              ) : (
                getSimilarPaceRunners().map(runner => (
                  <RunnerCard key={runner.id} runner={runner} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Streak Leaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getStreakLeaders().map((runner, index) => (
                <div key={runner.id} className="relative">
                  {index < 3 && (
                    <Badge 
                      variant="outline" 
                      className="absolute -top-2 -left-2 z-10"
                    >
                      #{index + 1}
                    </Badge>
                  )}
                  <RunnerCard runner={runner} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
