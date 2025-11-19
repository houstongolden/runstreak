import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Flame } from "lucide-react";

interface Step3Props {
  runner: any;
}

export default function Step3({ runner }: Step3Props) {
  const navigate = useNavigate();

  // Create a mock heatmap grid (simplified for preview)
  const mockHeatmap = Array.from({ length: 12 }, (_, monthIdx) => {
    const daysInMonth = 30;
    const days = Array.from({ length: daysInMonth }, (_, dayIdx) => ({
      date: `2024-${String(monthIdx + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`,
      hasActivity: Math.random() > 0.3, // Random activity for demo
    }));
    return { month: monthIdx, days };
  });

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Calendar className="h-20 w-20 text-primary mx-auto" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            Track Your Consistency
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Visualize your running habits with the activity heatmap
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-1">
              {mockHeatmap.map((month, idx) => (
                <div key={idx} className="space-y-1">
                  {month.days.slice(0, 7).map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`w-3 h-3 rounded-sm ${
                        day.hasActivity
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <span>No activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Activity logged</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-start gap-3 text-left bg-muted/50 p-4 rounded-lg">
          <Flame className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground font-instrument">
            Your heatmap updates automatically when you complete runs. The more consistent you are, 
            the more vibrant your heatmap becomes!
          </p>
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/onboarding/step-2')}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={() => navigate('/onboarding/step-4')}
          size="lg"
          className="text-base px-8"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
