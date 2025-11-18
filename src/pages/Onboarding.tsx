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
import Step5 from "./onboarding/Step5";
import Step6 from "./onboarding/Step6";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [runner, setRunner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState(0);
  const [totalRunners, setTotalRunners] = useState(0);

  useEffect(() => {
    const runnerId = searchParams.get('runnerId');
    
    if (!runnerId) {
      toast.error('Missing runner information');
      navigate('/');
      return;
    }

    fetchRunner(runnerId);
  }, [searchParams, navigate]);

  const fetchRunner = async (runnerId: string) => {
    try {
      // Fetch runner data
      const { data: runnerData, error: runnerError } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .single();

      if (runnerError) throw runnerError;

      // Fetch leaderboard stats
      const { count: totalCount } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true });

      const { count: betterRunners } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true })
        .gt('current_streak_days', runnerData.current_streak_days || 0);

      const rank = (betterRunners || 0) + 1;

      setRunner(runnerData);
      setLeaderboardRank(rank);
      setTotalRunners(totalCount || 0);
    } catch (error) {
      console.error('Error fetching runner:', error);
      toast.error('Failed to load runner data');
      navigate('/');
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-instrument font-semibold">Welcome to RunStreak</h1>
          </div>
        </div>

        {/* Step content */}
        <Routes>
          <Route path="step-1" element={<Step1 runner={runner} leaderboardRank={leaderboardRank} totalRunners={totalRunners} />} />
          <Route path="step-2" element={<Step2 runner={runner} leaderboardRank={leaderboardRank} totalRunners={totalRunners} />} />
          <Route path="step-3" element={<Step3 runner={runner} />} />
          <Route path="step-4" element={<Step4 runner={runner} />} />
          <Route path="step-5" element={<Step5 runner={runner} />} />
          <Route path="step-6" element={<Step6 runner={runner} />} />
        </Routes>
      </div>
    </div>
  );
}
