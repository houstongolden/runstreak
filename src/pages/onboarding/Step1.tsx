import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

interface Step1Props {
  runner: any;
  leaderboardRank: number;
  totalRunners: number;
}

export default function Step1({ runner, leaderboardRank, totalRunners }: Step1Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(runner.current_streak_days === 0);
  const [currentRunner, setCurrentRunner] = useState(runner);
  const [currentRank, setCurrentRank] = useState(leaderboardRank);
  const [messageIndex, setMessageIndex] = useState(0);
  const [mockupIndex, setMockupIndex] = useState(0);

  const loadingMessages = [
    "Scanning your activities...",
    "Crunching the numbers...",
    "Analyzing your position on the leaderboard...",
    "Calculating your streak...",
    "Comparing with other runners...",
    "Almost there..."
  ];

  // Rotate loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 6000); // Change message every 6 seconds

    return () => clearInterval(messageInterval);
  }, [isLoading, loadingMessages.length]);

  // Rotate mockup displays
  useEffect(() => {
    if (!isLoading) return;
    
    const mockupInterval = setInterval(() => {
      setMockupIndex((prev) => (prev + 1) % 2); // Toggle between 2 mockups
    }, 8000); // Change mockup every 8 seconds

    return () => clearInterval(mockupInterval);
  }, [isLoading]);

  useEffect(() => {
    // Trigger confetti on mount (only if data is loaded)
    if (!isLoading) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#ff6b35', '#f7931e', '#fdc830'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#ff6b35', '#f7931e', '#fdc830'],
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Poll for updated data while loading
  useEffect(() => {
    if (!isLoading) return;

    const pollInterval = setInterval(async () => {
      const { data: updatedRunner } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runner.id)
        .single();

      if (updatedRunner && updatedRunner.current_streak_days > 0) {
        // Data is ready! Update state and trigger confetti
        setCurrentRunner(updatedRunner);
        
        // Recalculate rank
        const { count: betterRunners } = await supabase
          .from('runners')
          .select('*', { count: 'exact', head: true })
          .gt('current_streak_days', updatedRunner.current_streak_days || 0);
        
        setCurrentRank((betterRunners || 0) + 1);
        setIsLoading(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isLoading, runner.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Flame className="h-20 w-20 text-primary mx-auto animate-pulse" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            You've joined the leaderboard! 🎉
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Welcome to the RunStreak community
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={currentRunner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentRunner.display_name}`}
                alt={currentRunner.display_name}
                className="w-20 h-20 rounded-full border-4 border-primary/30"
              />
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-xl font-bold text-foreground font-instrument">{currentRunner.display_name}</p>
              
              {isLoading ? (
                <div className="space-y-4">
                  {/* Animated Message */}
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground font-instrument animate-fade-in">
                      {loadingMessages[messageIndex]}
                    </p>
                    <p className="text-xs text-muted-foreground font-instrument mt-1">
                      This could take 2 seconds to 2 minutes depending on your activity history
                    </p>
                  </div>

                  {/* Visual Mockup with Scanning Animation */}
                  <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-muted/30 p-4 h-48">
                    {mockupIndex === 0 ? (
                      // Activity Heatmap Mockup
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-instrument mb-3">Activity Map</p>
                        <div className="grid grid-cols-7 gap-1.5">
                          {Array.from({ length: 35 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-6 w-6 rounded ${
                                i % 4 === 0 ? 'bg-primary/60' : 
                                i % 3 === 0 ? 'bg-primary/40' : 
                                i % 2 === 0 ? 'bg-primary/20' : 
                                'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Leaderboard Mockup
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-instrument mb-3">Leaderboard Preview</p>
                        {[1, 2, 3, 4, 5].map((rank) => (
                          <div key={rank} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            <span className="text-xs font-bold text-muted-foreground w-6">#{rank}</span>
                            <div className="h-6 w-6 rounded-full bg-primary/40" />
                            <div className="h-3 flex-1 bg-muted rounded" />
                            <div className="h-3 w-12 bg-primary/60 rounded" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Scanning Bar Animation */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-[scan_2s_ease-in-out_infinite]" 
                           style={{ 
                             animation: 'scan 2s ease-in-out infinite',
                             position: 'absolute',
                             top: '0',
                           }} 
                      />
                    </div>
                  </div>

                  {/* Progress Dots */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 animate-fade-in">
                    <p className="text-3xl font-bold text-primary font-instrument">
                      #{currentRank}
                    </p>
                    <p className="text-sm text-muted-foreground font-instrument">
                      of {totalRunners} runners
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground font-instrument animate-fade-in">
                    Current Streak: <span className="text-primary font-semibold">{currentRunner.current_streak_days} days</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground font-instrument leading-relaxed">
            Remember: Keep your streak alive by running <span className="text-primary font-semibold">at least 1 mile per day</span>
          </p>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => navigate('/onboarding/step-2')}
          size="lg"
          className="text-base px-8"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
