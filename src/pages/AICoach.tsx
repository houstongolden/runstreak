import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AICoachChat from "@/components/AICoachChat";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AICoach() {
  const { runnerId } = useParams<{ runnerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!runnerId);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(runnerId || null);

  useEffect(() => {
    // If no runner ID in URL, try to find the first runner
    if (!runnerId) {
      const findRunner = async () => {
        const { data, error } = await supabase
          .from('runners')
          .select('id')
          .limit(1)
          .single();
        
        if (data && !error) {
          navigate(`/coach/${data.id}`, { replace: true });
        } else {
          setLoading(false);
        }
      };
      findRunner();
    } else {
      setSelectedRunnerId(runnerId);
      setLoading(false);
    }
  }, [runnerId, navigate]);

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedRunnerId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No runners found. Please connect your Strava account to start chatting with the AI coach.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <AICoachChat runnerId={selectedRunnerId} />
    </div>
  );
}
