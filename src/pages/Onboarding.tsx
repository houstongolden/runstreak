import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Flame, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Step1 from "./onboarding/Step1";
import Step2 from "./onboarding/Step2";
import Step3 from "./onboarding/Step3";
import Step4 from "./onboarding/Step4";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [runner, setRunner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [totalRunners, setTotalRunners] = useState(0);

  useEffect(() => {
    const runnerId = searchParams.get('runnerId');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!runnerId) {
      toast.error('Missing runner information');
      navigate('/');
      return;
    }

    // Establish session with tokens from OAuth callback
    if (accessToken && refreshToken) {
      console.log('[Onboarding] Setting up session...');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('[Onboarding] Session setup error:', error);
          toast.error('Failed to authenticate');
          navigate('/');
          return;
        }
        console.log('[Onboarding] Session established, fetching runner data');
        fetchRunner(runnerId);
      });
    } else {
      // Already authenticated, just fetch data
      console.log('[Onboarding] Already authenticated, fetching runner data');
      fetchRunner(runnerId);
    }
  }, [searchParams, navigate]);

  const fetchRunner = async (runnerId: string) => {
    try {
      console.log('[Onboarding] Fetching runner data for ID:', runnerId);
      
      // Fetch runner data
      const { data: runnerData, error: runnerError } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .maybeSingle();

      if (runnerError) {
        console.error('[Onboarding] Runner fetch error:', runnerError);
        throw runnerError;
      }
      
      if (!runnerData) {
        console.error('[Onboarding] No runner found with ID:', runnerId);
        toast.error('Runner profile not found. Please try connecting Strava again.');
        setTimeout(() => navigate('/connect'), 2000);
        return;
      }
      
      console.log('[Onboarding] Runner data loaded:', {
        id: runnerData.id,
        display_name: runnerData.display_name,
        current_streak_days: runnerData.current_streak_days
      });

      // Fetch leaderboard stats
      const { count: totalCount } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true });

      const { count: betterRunners } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true })
        .gt('current_streak_days', runnerData.current_streak_days || 0);

      const rank = (betterRunners || 0) + 1;
      
      console.log('[Onboarding] Leaderboard stats:', { rank, totalRunners: totalCount });

      setRunner(runnerData);
      setLeaderboardRank(rank);
      setTotalRunners(totalCount || 0);
    } catch (error) {
      console.error('[Onboarding] Fatal error fetching runner:', error);
      toast.error('Failed to load runner data');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flame className="h-16 w-16 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!runner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step content */}
        <Routes>
          <Route path="step-1" element={<Step1 runner={runner} leaderboardRank={leaderboardRank} totalRunners={totalRunners} />} />
          <Route path="step-2" element={<Step2 runner={runner} leaderboardRank={leaderboardRank} totalRunners={totalRunners} />} />
          <Route path="step-3" element={<Step3 runner={runner} />} />
          <Route path="step-4" element={<Step4 runner={runner} />} />
        </Routes>
      </div>
    </div>
  );
}
