import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UnverifiedAccountBanner() {
  const { runnerId } = useAuth();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!runnerId) return;

    const checkVerificationStatus = async () => {
      try {
        // Check if runner has a linked user_id
        const { data: runner } = await supabase
          .from('runners')
          .select('user_id, email')
          .eq('id', runnerId)
          .single();

        // If no user_id, they haven't verified yet
        if (!runner?.user_id) {
          setShowBanner(true);
        } else {
          // Check if email or phone is verified
          const { data: settings } = await supabase
            .from('user_settings')
            .select('email_verified, phone_verified')
            .eq('runner_id', runnerId)
            .single();

          // Show banner if neither email nor phone is verified
          if (settings && !settings.email_verified && !settings.phone_verified) {
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    checkVerificationStatus();
  }, [runnerId]);

  const handleVerify = () => {
    navigate(`/verify-account?runnerId=${runnerId}`);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!showBanner || isDismissed) return null;

  return (
    <Alert className="border-orange-500 bg-orange-500/10 mb-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-sm">
            <strong>Verify your account</strong> to secure your RunStreak profile and unlock all features.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleVerify}
            className="h-7"
          >
            Verify Now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
