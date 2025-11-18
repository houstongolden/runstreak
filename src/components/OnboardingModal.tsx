import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Users, ChevronRight, Award, BarChart3, Heart, Zap, Target, CheckCircle2, ArrowRight, CheckCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Runner } from "@/types";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
  { id: 3, title: "Leaderboard" },
  { id: 4, title: "Activity Heatmap" },
  { id: 5, title: "Stay Accountable" },
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

  const handleNext = () => {
    if (currentStep === 2 && !emailAlreadyVerified && email) {
      handleEmailVerification();
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

  const accountabilityData = [
    { category: 'Without', value: 35 },
    { category: 'With RunStreak', value: 88 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[100vh] overflow-y-auto border-primary/20 [&>button]:hidden flex flex-col">
        <DialogHeader>
          <div className="text-center space-y-3">
            <Progress value={(currentStep / steps.length) * 100} className="h-1.5" />
          </div>
        </DialogHeader>

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

        {currentStep === 3 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">See how you rank</p>
              <p className="text-base text-muted-foreground font-instrument">You're competing with runners worldwide</p>
            </div>
            <Card className="bg-card border-primary/20 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">#{leaderboardRank}</Badge>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={runner?.avatar_url || ''} alt={runner?.display_name} />
                      <AvatarFallback>{runner?.display_name?.charAt(0) || 'R'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{runner.display_name}</p>
                      <p className="text-sm text-muted-foreground">{runner.current_streak_days || 0} days</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{totalRunners}</p>
                    <p className="text-sm text-muted-foreground">Total Runners</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">#{leaderboardRank}</p>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

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

        {currentStep === 5 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-instrument font-medium text-foreground">Stay Accountable</p>
              <p className="text-base text-muted-foreground font-instrument">Runners with accountability maintain consistency</p>
            </div>
            <Card className="bg-card border-primary/20 p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accountabilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }} formatter={(value) => [`${value}%`, 'Consistency']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                    {accountabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--muted))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <div className="text-center space-y-4">
              <p className="text-3xl font-bold text-primary font-instrument">+53%</p>
              <p className="text-sm text-muted-foreground mt-1 font-instrument">Higher consistency with accountability</p>
              <div className="space-y-2 text-left">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Daily reminders to keep your streak alive
                </p>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Community support when you need it most
                </p>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  AI coach insights to improve performance
                </p>
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
              onClick={() => setCurrentStep(currentStep + 1)}
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