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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runner: Runner | null;
  leaderboardRank: number;
  totalRunners: number;
}

const steps = [
  { id: 1, title: "The Hard Truth About Consistency" },
  { id: 2, title: "Your Projected Growth" },
  { id: 3, title: "Your Starting Position" },
  { id: 4, title: "The Impact of Accountability" },
  { id: 5, title: "RunStreak Community" },
  { id: 6, title: "How It Works" },
  { id: 7, title: "Building Your Identity" },
  { id: 8, title: "Join the Movement" },
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
    if (open && currentStep === 8) {
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

  const consistencyData = [
    { day: 'Mon', withoutApp: 40, withApp: 85 }, { day: 'Tue', withoutApp: 35, withApp: 90 },
    { day: 'Wed', withoutApp: 30, withApp: 88 }, { day: 'Thu', withoutApp: 25, withApp: 92 },
    { day: 'Fri', withoutApp: 20, withApp: 87 }, { day: 'Sat', withoutApp: 45, withApp: 95 }, { day: 'Sun', withoutApp: 50, withApp: 93 }
  ];

  const yourPotentialData = [
    { week: 'Week 1', streak: runner?.current_streak_days || 0 },
    { week: 'Week 2', streak: (runner?.current_streak_days || 0) + 5 },
    { week: 'Week 3', streak: (runner?.current_streak_days || 0) + 12 },
    { week: 'Week 4', streak: (runner?.current_streak_days || 0) + 20 },
    { week: 'Month 2', streak: (runner?.current_streak_days || 0) + 45 },
    { week: 'Month 3', streak: (runner?.current_streak_days || 0) + 75 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-primary/20">
        <DialogHeader>
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {steps[currentStep - 1].title}
            </h2>
            <Progress value={(currentStep / steps.length) * 100} className="h-1.5" />
          </div>
        </DialogHeader>

        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <Heart className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Most runners <span className="font-bold text-destructive">fail</span> to stay consistent. Life gets busy. Motivation fades. The streak breaks.
              </p>
              <p className="text-2xl font-bold text-foreground">Sound familiar?</p>
            </div>
            <Card className="bg-muted/30 border-destructive/20 p-6">
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground font-semibold uppercase tracking-wide">Without Accountability</p>
                <div className="space-y-3">
                  {['You run when you feel like it', 'No one notices when you skip a day', 'Your goals slowly fade away', 'You stay stuck in the same place, year after year'].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">{i === 0 ? <><span className="italic">{text}</span></> : text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <div className="text-center"><p className="text-xl font-semibold text-foreground">But it doesn't have to be this way.</p></div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">Hey {runner?.display_name?.split(' ')[0] || 'Runner'}!</p>
                <p className="text-base text-muted-foreground mt-2">Current streak: <span className="font-bold text-primary">{runner?.current_streak_days || 0} days</span></p>
              </div>
            </div>
            <Card className="bg-card border-primary/20 p-4 sm:p-6">
              <h3 className="text-center font-semibold mb-3 text-sm sm:text-base text-foreground">Your 90-Day Projection</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={yourPotentialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }} formatter={(value) => [`${value} days`, 'Streak']} />
                  <Line type="monotone" dataKey="streak" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3">With consistent daily engagement</p>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Where you are and where you're headed
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <Award className="h-8 w-8 text-primary mb-3" />
                <p className="font-semibold text-foreground mb-2">Starting Position</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary mb-1">#{leaderboardRank}</p>
                <p className="text-sm text-muted-foreground">out of {totalRunners} runners</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <Zap className="h-8 w-8 text-accent mb-3" />
                <p className="font-semibold text-foreground mb-2">Your Potential</p>
                <p className="text-3xl sm:text-4xl font-bold text-accent mb-1">Top 10%</p>
                <p className="text-sm text-muted-foreground">in 90 days with RunStreak</p>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 4 && stats && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                +{stats.avg_days_on_streak_improvement.toFixed(0)}% Improvement
              </p>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Real data from RunStreak users showing dramatic improvements in consistency
              </p>
            </div>
            <Card className="bg-card border-primary/20 p-4 sm:p-6">
              <h3 className="text-center font-semibold mb-3 text-sm sm:text-base text-foreground">With vs Without Accountability</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={consistencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '14px' }} />
                  <Bar dataKey="withoutApp" name="Without" fill="hsl(0 0% 100%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withApp" name="With RunStreak" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {currentStep === 5 && stats && (
          <div className="space-y-4 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Real numbers from our community
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, value: `${stats.avg_days_on_streak_percentage.toFixed(0)}%`, label: 'Consistency', color: 'primary' },
                { icon: Users, value: stats.total_users.toLocaleString(), label: 'Runners', color: 'accent' },
                { icon: Flame, value: stats.active_streaks_count.toLocaleString(), label: 'Streaks', color: 'primary' }
              ].map((stat, i) => (
                <Card key={i} className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
            <Card className="bg-muted/30 border-primary/20 p-6 text-center">
              <p className="text-base sm:text-lg text-foreground leading-relaxed">
                Join a community of runners who show up every single day.
              </p>
            </Card>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Three powerful forces keeping you consistent
              </p>
            </div>
            <Card className="bg-muted/30 border-primary/20 p-6">
              <div className="space-y-5">
                {[
                  { title: 'Public Accountability', desc: 'Your streak is visible. The community keeps you honest.' },
                  { title: 'Gamified Progress', desc: 'Climb the leaderboard. Earn recognition. Feel the momentum.' },
                  { title: 'AI Coaching', desc: 'Personalized insights and motivation when you need it most.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-base">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-6 py-8 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 p-8 text-center">
              <p className="text-xl sm:text-2xl font-bold text-primary mb-4">
                You're not just tracking runs.
              </p>
              <p className="text-base sm:text-lg text-foreground leading-relaxed">
                You're building an identity as someone who shows up, every single day.
              </p>
            </Card>
          </div>
        )}

        {currentStep === 8 && stats && (
          <div className="space-y-6 py-4 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-3">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">🔥 You're Ready!</h3>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
                Join <span className="font-bold text-primary">{stats.total_users.toLocaleString()}</span> runners building streaks
              </p>
            </div>
            <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/30 p-6 text-center">
              <p className="text-lg sm:text-xl font-bold text-foreground mb-2">RunStreak is Free Forever</p>
              <p className="text-sm sm:text-base text-muted-foreground mb-5">Full leaderboard access included</p>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                {['Public accountability that works', 'Real-time leaderboard rankings', 'AI-powered coaching insights', 'Community of dedicated runners'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm sm:text-base text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                "The best time to start was yesterday.<br/>The second best time is now."
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">Back</Button>}
          {currentStep < steps.length && <Button variant="ghost" onClick={handleSkip} className="flex-1">Skip</Button>}
          <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {currentStep === steps.length ? <>Start Your Journey <ArrowRight className="ml-2 h-5 w-5" /></> : <>Continue <ChevronRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
