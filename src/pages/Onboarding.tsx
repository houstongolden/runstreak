import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingModal } from "@/components/OnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [runner, setRunner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const { count: totalRunners } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true });

      const { count: betterRunners } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true })
        .gt('current_streak_days', runnerData.current_streak_days || 0);

      const leaderboardRank = (betterRunners || 0) + 1;

      setRunner({ 
        ...runnerData, 
        leaderboardRank, 
        totalRunners: totalRunners || 0 
      });
    } catch (error) {
      console.error('Error fetching runner:', error);
      toast.error('Failed to load runner data');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (runner) {
      // Add onboarding=complete parameter to trigger confetti on profile
      navigate(`/runner/${runner.id}?onboarding=complete`);
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
      <OnboardingModal
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            handleComplete();
          }
        }}
        runner={runner}
        leaderboardRank={runner.leaderboardRank || 0}
        totalRunners={runner.totalRunners || 0}
      />
    </div>
  );
}
