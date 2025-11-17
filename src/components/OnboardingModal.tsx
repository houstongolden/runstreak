import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, TrendingUp, Users, ChevronRight, Award, BarChart3, Heart, Zap, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  { id: 1, title: "Welcome" },
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

  const handleNext = () => currentStep < steps.length ? setCurrentStep(currentStep + 1) : (onOpenChange(false), navigate(`/runner/${runner?.id}`));
  const handleSkip = () => (onOpenChange(false), navigate(`/runner/${runner?.id}`));

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
              <p className="text-2xl sm:text-3xl font-bold font-instrument text-foreground">You've joined the leaderboard!</p>
              <p className="text-base text-muted-foreground font-instrument">Welcome to the RunStreak community</p>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={runner?.avatar_url || ''} alt={runner?.display_name} />
                  <AvatarFallback className="bg-primary/20 text-primary font-instrument">
                    {runner?.display_name?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground font-instrument">{runner?.display_name}</p>
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-instrument">
                      #{leaderboardRank}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-instrument">
                    {runner?.current_streak_days || 0} day streak
                  </p>
                </div>
              </div>
              <Separator className="bg-primary/20 mb-4" />
              <div className="text-center text-muted-foreground text-sm font-instrument">
                Top {Math.round((leaderboardRank / totalRunners) * 100)}% of {totalRunners.toLocaleString()} runners
              </div>
            </Card>
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
