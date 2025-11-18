import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

interface Step2Props {
  runner: any;
  leaderboardRank: number;
  totalRunners: number;
}

export default function Step2({ runner, leaderboardRank, totalRunners }: Step2Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Trophy className="h-20 w-20 text-primary mx-auto" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            You're on the Leaderboard
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Compete with runners worldwide
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg">
                  {leaderboardRank}
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={runner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${runner.display_name}`}
                    alt={runner.display_name}
                    className="w-12 h-12 rounded-full border-2 border-primary/30"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{runner.display_name}</p>
                    <p className="text-sm text-muted-foreground">That's you! 🎉</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{runner.current_streak_days || 0}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Ranked #{leaderboardRank} out of {totalRunners} runners</span>
            </div>
          </div>
        </Card>

        <p className="text-base text-muted-foreground font-instrument">
          Your position updates automatically as you maintain your streak
        </p>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('../step-1')}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={() => navigate('../step-3')}
          size="lg"
          className="text-base px-8"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
