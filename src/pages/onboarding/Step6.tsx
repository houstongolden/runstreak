import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Zap } from "lucide-react";

interface Step6Props {
  runner: any;
}

export default function Step6({ runner }: Step6Props) {
  const navigate = useNavigate();

  const handleFinish = () => {
    navigate(`/runner/${runner.id}?onboarding=complete`);
  };

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Flame className="h-20 w-20 text-primary mx-auto animate-pulse" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            Let's Go! 🔥
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Your runs are syncing from Strava
          </p>
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

        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-sm text-muted-foreground font-instrument leading-relaxed">
            <strong className="text-foreground">Pro tip:</strong> Set a daily reminder on your phone 
            to check your streak status. Consistency is everything!
          </p>
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/onboarding/step-5')}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={handleFinish}
          size="lg"
          className="text-base px-8"
        >
          View My Profile
        </Button>
      </div>
    </div>
  );
}
