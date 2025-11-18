import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, CheckCircle, Zap } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Runner } from "@/types";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runner: Runner | null;
  leaderboardRank: number;
  totalRunners: number;
}

const emailSchema = z.string().email({ message: "Invalid email address" }).max(255);

const steps = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Verify Email" },
  { id: 3, title: "Your Ranking" },
  { id: 4, title: "Track Consistency" },
  { id: 5, title: "Start Your Streak" },
];

export function OnboardingModal({ open, onOpenChange, runner, leaderboardRank, totalRunners }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const fetchStats = async () => {
        const { data } = await supabase.from("aggregate_stats").select("*").order("stat_date", { ascending: false }).limit(1).maybeSingle();
        if (data) setStats(data);
      };
      fetchStats();

      // Check if email is already verified
      const checkEmailVerification = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email && user.email_confirmed_at) {
          setEmail(user.email);
          setEmailAlreadyVerified(true);
        }
      };
      checkEmailVerification();
    }
  }, [open]);

  useEffect(() => {
    if (open && currentStep === 1) {
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#FF6B35', '#F7931E', '#FDC830'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#FF6B35', '#F7931E', '#FDC830'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [open, currentStep]);

  const handleEmailVerification = async () => {
    try {
      if (emailAlreadyVerified) {
        toast.success('Email already verified!');
        setCurrentStep(currentStep + 1);
        return;
      }

      const validatedEmail = emailSchema.parse(email.trim());
      setIsVerifyingEmail(true);

      // Create Supabase auth user with email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedEmail,
        password: crypto.randomUUID(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            runner_id: runner?.id,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Link runner to auth user
        await supabase
          .from('runners')
          .update({ 
            user_id: authData.user.id,
            email: validatedEmail 
          })
          .eq('id', runner?.id);

        // Update user settings
        await supabase
          .from('user_settings')
          .upsert({
            runner_id: runner?.id!,
            email: validatedEmail,
            email_verified: false
          }, {
            onConflict: 'runner_id'
          });

        toast.success('Verification email sent! Check your inbox.');
        setCurrentStep(currentStep + 1);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSkipEmail = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Email verification step - validate before proceeding
      if (email && !emailAlreadyVerified) {
        handleEmailVerification();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      navigate(`/runner/${runner?.id}?onboarding=complete`);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    navigate(`/runner/${runner?.id}`);
  };

  if (!runner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[100vh] overflow-y-auto border-primary/20 [&>button]:hidden flex flex-col">
        <DialogHeader>
          <div className="text-center space-y-3">
            <Progress value={(currentStep / steps.length) * 100} className="h-1.5" />
          </div>
        </DialogHeader>

        {/* Step 1: Welcome + Current Streak */}
        {currentStep === 1 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">You've joined the leaderboard!</p>
              <p className="text-base text-muted-foreground font-instrument">Run at least 1 mile per day to keep your streak alive</p>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={runner?.avatar_url || ''} alt={runner?.display_name} />
                  <AvatarFallback className="bg-primary/20 text-primary font-instrument">
                    {runner?.display_name?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="font-semibold text-lg font-instrument">{runner.display_name}</p>
                  <p className="text-sm text-muted-foreground font-instrument">@{runner.strava_username}</p>
                </div>
              </div>
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Flame className="h-8 w-8 text-primary" />
                  <p className="text-5xl font-bold text-primary font-instrument">{runner.current_streak_days || 0}</p>
                </div>
                <p className="text-base text-muted-foreground font-instrument">Day streak from Strava</p>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Email Verification */}
        {currentStep === 2 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">Verify Your Email</p>
              <p className="text-base text-muted-foreground font-instrument">Stay updated on your streak and community</p>
            </div>
            <Card className="bg-card border-primary/20 p-6">
              <div className="space-y-4">
                {emailAlreadyVerified ? (
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Email Verified</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-instrument">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isVerifyingEmail}
                        className="font-instrument"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-instrument">
                      We'll send you a verification link. You can skip this step and verify later in settings.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Leaderboard Ranking */}
        {currentStep === 3 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">Your Ranking</p>
              <p className="text-base text-muted-foreground font-instrument">See where you stand among {totalRunners} runners</p>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-4 rounded-full">
                  <p className="text-4xl font-bold text-primary font-instrument">#{leaderboardRank}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground font-instrument">Current Position</p>
              <p className="text-sm text-muted-foreground mt-2 font-instrument">
                You're ranked {leaderboardRank} out of {totalRunners} runners on the leaderboard
              </p>
            </Card>
          </div>
        )}

        {/* Step 4: Activity Heatmap Preview */}
        {currentStep === 4 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">Track Your Consistency</p>
              <p className="text-base text-muted-foreground font-instrument">Visualize your daily running habit</p>
            </div>
            <Card className="bg-card border-primary/20 p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const intensity = Math.floor(Math.random() * 5);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded ${
                          intensity === 0 ? 'bg-muted' :
                          intensity === 1 ? 'bg-primary/20' :
                          intensity === 2 ? 'bg-primary/40' :
                          intensity === 3 ? 'bg-primary/60' :
                          'bg-primary/80'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-sm text-center text-muted-foreground">Days active this month</p>
              </div>
            </Card>
            {stats && (
              <div className="text-center">
                <p className="text-3xl font-bold text-primary font-instrument">+{stats.avg_days_on_streak_improvement.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Average improvement in consistency</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Start Your Streak */}
        {currentStep === 5 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <Flame className="h-20 w-20 text-primary mx-auto animate-pulse" />
                <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">Let's Go! 🔥</p>
                <p className="text-lg text-muted-foreground font-instrument">Your runs are syncing from Strava</p>
              </div>
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-8 text-center">
                <p className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed font-instrument mb-3">
                  Every mile counts. Every day matters.
                </p>
                <p className="text-base text-muted-foreground font-instrument">
                  You're now part of a community that shows up daily. Ready to build your streak?
                </p>
              </Card>
              <div className="flex flex-col gap-3 text-center">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold font-instrument">Day 1 starts now</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip
          </Button>
          {currentStep === 2 && !emailAlreadyVerified && (
            <Button
              variant="outline"
              onClick={handleSkipEmail}
              className="flex-1"
            >
              Skip Email
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={currentStep === 2 && isVerifyingEmail}
          >
            {isVerifyingEmail ? 'Sending...' : currentStep === steps.length ? 'Go to Profile' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}