import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, Award } from "lucide-react";

export function RunStreakPhilosophy() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why RunStreak Is Different
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We believe consistency beats perfection. Life happens, and missing a day shouldn't derail your progress.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Days on Streak</h3>
                <p className="text-sm text-muted-foreground">
                  We track total active days over any period, not just consecutive days. Running 58 out of 60 days? That's a 96.7% streak rate!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Measure Improvement</h3>
                <p className="text-sm text-muted-foreground">
                  We compare your activity rate after joining RunStreak to before. Our goal: help you run more consistently than ever.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Celebrate Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Every streak is worth celebrating. We display your full history of achievements, not just your current run.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <blockquote className="text-center space-y-4">
              <p className="text-lg italic text-muted-foreground">
                "Breaking a 30-day streak doesn't mean you stop running for 30 days. 
                It means you keep going, because those 58 out of 60 days still count."
              </p>
              <p className="text-sm font-semibold">
                – The RunStreak Philosophy
              </p>
            </blockquote>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
