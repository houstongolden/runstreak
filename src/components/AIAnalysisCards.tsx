import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Target } from "lucide-react";
import { Runner } from "@/types";

interface Insight {
  title: string;
  description: string;
}

interface AIAnalysisCardsProps {
  runner: Runner;
}

const icons = [Sparkles, TrendingUp, Target];

export default function AIAnalysisCards({ runner }: AIAnalysisCardsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use cached AI analysis if available
    if (runner.ai_analysis?.insights && Array.isArray(runner.ai_analysis.insights)) {
      setInsights(runner.ai_analysis.insights);
      setIsLoading(false);
    } else {
      // Fallback: fetch fresh analysis if cache is empty
      const fetchAnalysis = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('analyze-runner', {
            body: { runnerData: runner }
          });

          if (error) throw error;
          setInsights(data.insights || []);
        } catch (error) {
          console.error('Error fetching AI analysis:', error);
          setInsights([
            { title: "Analysis Unavailable", description: "Unable to generate insights at this time." },
            { title: "Keep Running", description: "Your dedication speaks for itself!" },
            { title: "Data Tracking", description: "Continue logging your runs for better insights." }
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAnalysis();
    }
  }, [runner]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse min-h-[140px]">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.slice(0, 3).map((insight, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Card key={index} className="border-primary/20 min-h-[140px]">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base break-words">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground break-words">{insight.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
