import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface Step1Props {
  runner: any;
  leaderboardRank: number;
  totalRunners: number;
}

export default function Step1({ runner, leaderboardRank, totalRunners }: Step1Props) {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

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
  }, []);

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Flame className="h-24 w-24 text-primary mx-auto animate-pulse" />
          <p className="text-4xl sm:text-5xl font-instrument font-medium text-foreground">
            You've joined the leaderboard! 🎉
          </p>
          <p className="text-xl text-muted-foreground font-instrument">
            Welcome to the RunStreak community
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <img
                src={runner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${runner.display_name}`}
                alt={runner.display_name}
                className="w-24 h-24 rounded-full border-4 border-primary/30"
              />
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-foreground font-instrument">{runner.display_name}</p>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <span className="text-lg font-instrument">
                  Current Streak: <span className="text-primary font-semibold">{runner.current_streak_days || 0} days</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-muted/50 p-6">
          <p className="text-base text-muted-foreground font-instrument leading-relaxed">
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
