import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle phone verification redirect
  useEffect(() => {
    const needsVerification = searchParams.get('verify');
    const runnerId = searchParams.get('runnerId');
    const email = searchParams.get('email');
    
    if (needsVerification === 'phone' && runnerId) {
      toast.info('Please verify your phone number to complete registration');
      navigate(`/verify-phone?runnerId=${runnerId}&email=${email || ''}`);
    }
  }, [searchParams, navigate]);

  const handleStravaConnect = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('strava-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      toast.error('Failed to initiate Strava connection');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Flame className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to RunStreak</CardTitle>
          <CardDescription>
            Connect your Strava account to join the leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleStravaConnect}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            <Flame className="mr-2 h-5 w-5" />
            {isLoading ? 'Connecting...' : 'Connect with Strava'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            RunStreak requires Strava to verify your daily runs and maintain an accurate leaderboard
          </p>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
