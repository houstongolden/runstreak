import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  Medal,
  Target
} from "lucide-react";
import { Runner } from "@/types";
import confetti from "canvas-confetti";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runner: Runner | null;
  leaderboardRank: number;
  totalRunners: number;
}

const steps = [
  {
    id: 1,
    title: "Welcome to RunStreak! 🎉",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Key Features",
    icon: Target,
  },
];

export function OnboardingModal({ 
  open, 
  onOpenChange, 
  runner,
  leaderboardRank,
  totalRunners
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && currentStep === 1) {
      // Trigger confetti on modal open
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FF6B35', '#F7931E', '#FDC830'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FF6B35', '#F7931E', '#FDC830'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, currentStep]);

  const getRankSuffix = (rank: number) => {
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 10) return "🏆";
    if (rank <= 50) return "⭐";
    return "🔥";
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      navigate(`/runner/${runner?.id}`);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    navigate(`/runner/${runner?.id}`);
  };

  if (!runner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
            {steps[currentStep - 1].title}
          </DialogTitle>
          <DialogDescription className="text-center">
            Step {currentStep} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <Progress value={(currentStep / steps.length) * 100} className="mb-6" />

        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="text-8xl animate-bounce">
                    {getRankEmoji(leaderboardRank)}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-orange-500 to-primary bg-clip-text text-transparent animate-shiny-text">
                  Congratulations, {runner.display_name}!
                </h3>
                <p className="text-xl text-muted-foreground">
                  You're ranked{" "}
                  <span className="font-bold text-primary text-2xl">
                    #{leaderboardRank}
                  </span>
                  {getRankSuffix(leaderboardRank)} on the World RunStreak Leaderboard!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <Flame className="h-8 w-8 mx-auto mb-2 text-primary animate-pulse" />
                <div className="text-3xl font-bold text-primary">
                  {runner.current_streak_days || 0}
                </div>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-3xl font-bold text-orange-500">
                  #{leaderboardRank}
                </div>
                <p className="text-sm text-muted-foreground">of {totalRunners}</p>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-3xl font-bold text-green-500">
                  {runner.current_streak_miles?.toFixed(1) || "0.0"}
                </div>
                <p className="text-sm text-muted-foreground">Miles</p>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <Medal className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Your Achievement</h4>
                  <p className="text-sm text-muted-foreground">
                    {leaderboardRank <= 3 && "Incredible! You're in the top 3 runners worldwide! "}
                    {leaderboardRank > 3 && leaderboardRank <= 10 && "Amazing! You're in the top 10 runners! "}
                    {leaderboardRank > 10 && leaderboardRank <= 50 && "Impressive! You're in the top 50! "}
                    {leaderboardRank > 50 && "Great work on maintaining your streak! "}
                    Keep the momentum going and climb even higher!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <p className="text-center text-muted-foreground mb-6">
              Here's what you can do on RunStreak:
            </p>

            <div className="space-y-4">
              <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/')}>
                <div className="flex items-start gap-4">
                  <Trophy className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      Leaderboard
                      <Badge variant="secondary" className="text-xs">Must-See</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Track your ranking and compete with runners worldwide. Updated in real-time!
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/activities')}>
                <div className="flex items-start gap-4">
                  <Flame className="h-8 w-8 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Daily Activities</h4>
                    <p className="text-sm text-muted-foreground">
                      View your heatmap and track every run in your streak journey.
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/discover')}>
                <div className="flex items-start gap-4">
                  <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Discover Runners</h4>
                    <p className="text-sm text-muted-foreground">
                      Follow other runners and build your accountability network.
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/ai-coach')}>
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-8 w-8 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      AI Coach
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Get personalized training advice and motivation from your AI running coach.
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            className="min-w-24"
          >
            {currentStep === steps.length ? "Let's Go!" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
