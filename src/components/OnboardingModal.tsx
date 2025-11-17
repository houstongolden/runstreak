import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, TrendingUp, Users, ChevronRight, Award, BarChart3, Heart, Zap, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { Runner } from "@/types";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runner: Runner | null;
  leaderboardRank: number;
  totalRunners: number;
}

const steps = [
  { id: 1, title: "Join the Leaderboard" },
  { id: 2, title: "Track Your Consistency" },
  { id: 3, title: "Stay Accountable" },
  { id: 4, title: "Join the Community" },
  { id: 5, title: "Start Your Streak" },
];

export function OnboardingModal({ open, onOpenChange, runner, leaderboardRank, totalRunners }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const fetchStats = async () => {
        const { data } = await supabase.from("aggregate_stats").select("*").order("stat_date", { ascending: false }).limit(1).maybeSingle();
        if (data) setStats(data);
      };
      fetchStats();
    }
  }, [open]);

  useEffect(() => {
    if (open && currentStep === 5) {
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

  const handleNext = () => currentStep < steps.length ? setCurrentStep(currentStep + 1) : (onOpenChange(false), navigate(`/runner/${runner?.id}`));
  const handleSkip = () => (onOpenChange(false), navigate(`/runner/${runner?.id}`));

  if (!runner) return null;

  const accountabilityData = [
    { category: 'Without', value: 35 },
    { category: 'With RunStreak', value: 88 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-primary/20">
        <DialogHeader>
          <div className="text-center space-y-3">
            <Progress value={(currentStep / steps.length) * 100} className="h-1.5" />
          </div>
        </DialogHeader>

        {currentStep === 1 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">Join the Leaderboard</p>
              <p className="text-base text-muted-foreground">Here's how your profile will look</p>
            </div>
            <Card className="bg-card border-primary/20 p-4">
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">#{leaderboardRank}</div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {runner?.display_name?.charAt(0) || 'R'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{runner?.display_name || 'Your Name'}</p>
                    <p className="text-sm text-muted-foreground">@{runner?.strava_username || 'username'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{runner?.current_streak_days || 0}</p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
              </div>
            </Card>
            <p className="text-center text-sm text-muted-foreground font-instrument">Your streak is visible to everyone. The community keeps you honest.</p>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">Increase Your Consistency</p>
              <p className="text-base text-muted-foreground">Track every run with your activity heatmap</p>
            </div>
            <Card className="bg-card border-primary/20 p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${
                          intensity === 0 ? 'bg-muted/30' :
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

        {currentStep === 3 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">Stay Accountable</p>
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
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(0 0% 100%)' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary font-instrument">+53%</p>
              <p className="text-sm text-muted-foreground mt-1 font-instrument">Higher consistency with accountability</p>
            </div>
          </div>
        )}

        {currentStep === 4 && stats && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">Join the Community</p>
              <p className="text-base text-muted-foreground font-instrument">Real stats from runners like you</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, value: stats.total_users.toLocaleString(), label: 'Runners' },
                { icon: Flame, value: stats.active_streaks_count.toLocaleString(), label: 'Active Streaks' },
                { icon: TrendingUp, value: `${stats.avg_days_on_streak_percentage.toFixed(0)}%`, label: 'Consistency' }
              ].map((stat, i) => (
                <Card key={i} className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-primary font-instrument">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-instrument">{stat.label}</p>
                </Card>
              ))}
            </div>
            <Card className="bg-muted/30 border-primary/20 p-6 text-center">
              <p className="text-base sm:text-lg text-foreground leading-relaxed font-instrument">
                A community of runners who show up every single day
              </p>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">Ready to Start Your Streak</p>
              <p className="text-base text-muted-foreground font-instrument">Your runs are already syncing from Strava</p>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6 text-center">
              <Flame className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-base sm:text-lg text-foreground leading-relaxed font-instrument">
                Every day you run, your streak grows. The community is watching. Stay consistent.
              </p>
            </Card>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">Back</Button>}
          {currentStep < steps.length && <Button variant="ghost" onClick={handleSkip} className="flex-1">Skip</Button>}
          <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {currentStep === steps.length ? <>Start Your Streak</> : <>Continue</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
