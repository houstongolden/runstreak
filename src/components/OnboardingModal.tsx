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
  { id: 2, title: "How RunStreak Changes Everything" },
  { id: 3, title: "Your Personalized Journey Starts Now" },
  { id: 4, title: "Join the Movement" },
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
    if (open && currentStep === 4) {
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
          <div className="space-y-8 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                RunStreak users experience a <span className="font-bold text-primary">{stats ? `+${stats.avg_days_on_streak_improvement.toFixed(0)}%` : '+67%'}</span> improvement in running consistency.
              </p>
            </div>
            <Card className="bg-card border-primary/20 p-6">
              <h3 className="text-center font-semibold mb-4 text-foreground">Running Consistency: With vs Without Accountability</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={consistencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="withoutApp" name="Without RunStreak" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withApp" name="With RunStreak" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, value: stats ? `${stats.avg_days_on_streak_percentage.toFixed(0)}%` : '85%', label: 'Average consistency rate', color: 'primary' },
                { icon: Users, value: stats ? stats.total_users.toLocaleString() : '1,234', label: 'Active runners', color: 'accent' },
                { icon: Flame, value: stats ? stats.active_streaks_count.toLocaleString() : '892', label: 'Active streaks today', color: 'primary' }
              ].map((stat, i) => (
                <Card key={i} className={`p-6 text-center bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5 border-${stat.color}/20`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color} mx-auto mb-2`} />
                  <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
            <Card className="bg-muted/30 border-primary/20 p-6">
              <div className="space-y-3">
                {[
                  { title: 'Public Accountability', desc: 'Your streak is visible. The community keeps you honest.' },
                  { title: 'Gamified Progress', desc: 'Climb the leaderboard. Earn recognition. Feel the momentum.' },
                  { title: 'AI Coaching', desc: 'Personalized insights and motivation when you need it most.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div><p className="font-semibold text-foreground">{item.title}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Hey {runner?.display_name?.split(' ')[0] || 'Runner'}, this is YOUR journey.</p>
                <p className="text-lg text-muted-foreground mt-2">Based on your current streak of <span className="font-bold text-primary">{runner?.current_streak_days || 0} days</span>, here's where you could be:</p>
              </div>
            </div>
            <Card className="bg-card border-primary/20 p-6">
              <h3 className="text-center font-semibold mb-4 text-foreground">Your Projected Streak Growth</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={yourPotentialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value) => [`${value} days`, 'Streak']} />
                  <Line type="monotone" dataKey="streak" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-muted-foreground mt-4">Projected 90-day streak growth with consistent engagement</p>
            </Card>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <Award className="h-8 w-8 text-primary mb-3" />
                <p className="font-semibold text-foreground mb-2">Your Starting Position</p>
                <p className="text-3xl font-bold text-primary mb-1">#{leaderboardRank}</p>
                <p className="text-sm text-muted-foreground">out of {totalRunners} runners</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <Zap className="h-8 w-8 text-accent mb-3" />
                <p className="font-semibold text-foreground mb-2">Your Potential</p>
                <p className="text-3xl font-bold text-accent mb-1">Top 10%</p>
                <p className="text-sm text-muted-foreground">in 90 days with RunStreak</p>
              </Card>
            </div>
            <Card className="bg-muted/30 border-primary/20 p-6 text-center">
              <p className="text-lg text-foreground leading-relaxed"><span className="font-bold text-primary">You're not just tracking runs.</span><br/>You're building an identity as someone who shows up, every single day.</p>
            </Card>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in-50 duration-700">
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">You're Not Alone</h3>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">Join <span className="font-bold text-primary">{stats ? stats.total_users.toLocaleString() : '1,234'}</span> runners who refuse to break their streak.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: stats?.total_users.toLocaleString() || '1,234', label: 'Total Runners', icon: Users },
                { value: stats?.active_streaks_count.toLocaleString() || '892', label: 'Active Streaks', icon: Flame },
                { value: `${stats?.avg_days_on_streak_percentage.toFixed(0) || '85'}%`, label: 'Consistency', icon: TrendingUp },
                { value: `+${stats?.avg_days_on_streak_improvement.toFixed(0) || '67'}%`, label: 'Improvement', icon: BarChart3 }
              ].map((stat, i) => (
                <Card key={i} className="p-4 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
            <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/30 p-8 text-center">
              <p className="text-2xl font-bold text-foreground mb-3">🔥 Ready to transform your running?</p>
              <p className="text-lg text-muted-foreground mb-6">RunStreak is <span className="font-bold text-primary">free forever</span> for leaderboard access.</p>
              <div className="space-y-3 text-left max-w-md mx-auto">
                {['Public accountability that works', 'Real-time leaderboard rankings', 'AI-powered coaching insights', 'Community of dedicated runners'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="text-center"><p className="text-sm text-muted-foreground italic">"The best time to plant a tree was 20 years ago.<br/>The second best time is now."</p></div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">Back</Button>}
          {currentStep < steps.length && <Button variant="ghost" onClick={handleSkip} className="flex-1">Skip</Button>}
          <Button onClick={handleNext} className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            {currentStep === steps.length ? <></>Start Your Journey <ArrowRight className="ml-2 h-5 w-5" /></> : <>Continue <ChevronRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
