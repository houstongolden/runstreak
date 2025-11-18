import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, TrendingUp, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step2Props {
  runner: any;
  leaderboardRank: number;
  totalRunners: number;
}

export default function Step2({ runner, leaderboardRank, totalRunners }: Step2Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullSyncTriggered, setFullSyncTriggered] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save email to user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          runner_id: runner.id,
          user_email: email,
          email_verified: false
        });

      if (settingsError) throw settingsError;

      // Trigger full activity sync in background (don't wait for it)
      if (!fullSyncTriggered) {
        console.log('[Step2] Triggering full activity sync after email entry...');
        setFullSyncTriggered(true);
        
        supabase.functions
          .invoke('sync-strava', {
            body: { runnerId: runner.id }
          })
          .then(({ error }) => {
            if (error) {
              console.error('[Step2] Full sync error:', error);
            } else {
              console.log('[Step2] Full activity sync triggered successfully');
            }
          });
      }

      toast.success('Email saved! Syncing your complete activity history...');
      
      // Navigate to next step immediately (sync continues in background)
      setTimeout(() => navigate('../step-3'), 500);
    } catch (error) {
      console.error('[Step2] Error saving email:', error);
      toast.error('Failed to save email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Enter your email to continue</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleEmailSubmit}
              disabled={isSubmitting || !email}
              size="lg"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('../step-3')}
              disabled={isSubmitting}
              size="lg"
            >
              Skip
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            We'll sync your complete activity history in the background
          </p>
        </div>
      </div>

      <div className="flex justify-start gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('../step-1')}
          size="lg"
          disabled={isSubmitting}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
