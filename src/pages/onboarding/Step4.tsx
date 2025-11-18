import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Target } from "lucide-react";

interface Step4Props {
  runner: any;
}

export default function Step4({ runner }: Step4Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Users className="h-20 w-20 text-primary mx-auto" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            Stay Accountable
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Join a community that shows up every day
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-8">
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-4 text-left">
                <div className="p-3 rounded-lg bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground font-instrument mb-1">Track Progress</p>
                  <p className="text-sm text-muted-foreground">
                    See your days on streak, total miles, and consistency metrics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground font-instrument mb-1">Community Support</p>
                  <p className="text-sm text-muted-foreground">
                    Follow other runners, share updates, and stay motivated together
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground font-instrument mb-1">Daily Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your streak is at risk so you never miss a day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-base text-muted-foreground font-instrument">
          RunStreak keeps you accountable to your running goals
        </p>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/onboarding/step-3')}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={() => navigate('/onboarding/step-5')}
          size="lg"
          className="text-base px-8"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
