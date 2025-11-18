import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function StravaConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stravaStatus = searchParams.get('strava');
    const message = searchParams.get('message');
    const runnerId = searchParams.get('runnerId');
    
    // Check if this page was opened in a popup
    const isPopup = window.opener && !window.opener.closed;
    
    if (stravaStatus === 'success') {
      if (isPopup) {
        // Post message to parent window and let it handle the redirect
        window.opener.postMessage({
          type: 'strava-auth-success',
          runnerId: runnerId
        }, window.location.origin);
        // Popup will be closed by parent
      } else {
        // Regular flow for non-popup
        if (runnerId) {
          toast.success('Successfully connected to Strava!');
          setTimeout(() => navigate(`/runner/${runnerId}`), 1500);
        }
      }
    } else if (stravaStatus === 'error') {
      if (isPopup) {
        window.opener.postMessage({
          type: 'strava-auth-error',
          message: message || 'Unknown error'
        }, window.location.origin);
        // Popup will be closed by parent
      } else {
        toast.error(`Failed to connect: ${message || 'Unknown error'}`);
      }
    }
  }, [searchParams, navigate]);

  const handleConnect = async () => {
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
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <Flame className="w-20 h-20 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Connect to Strava
          </h1>
          <p className="text-muted-foreground">
            Join the RunStreak leaderboard by connecting your Strava account
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect with Strava'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
