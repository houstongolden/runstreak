import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AICoachChat from "@/components/AICoachChat";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Hardcoded admin runner ID - only this user can access AI Coach
const ADMIN_RUNNER_ID = "cd018a20-5fa4-42cf-8842-590d8afe1283";

export default function AICoach() {
  const { runnerId } = useParams<{ runnerId: string }>();
  const { runnerId: currentUserRunnerId } = useAuth();
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

  // Check if current user is admin
  if (currentUserRunnerId !== ADMIN_RUNNER_ID) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            AI Coach is currently unavailable. Please check back later.
          </CardContent>
        </Card>
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
    <div className="h-screen w-full flex flex-col">
      <AICoachChat runnerId={selectedRunnerId} />
    </div>
  );
}
