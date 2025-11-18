import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getPricing = (activeSpots: number) => {
  if (activeSpots < 5) return 299;
  if (activeSpots < 10) return 399;
  if (activeSpots < 15) return 599;
  return 799;
};

export default function AdCheckout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSpots, setActiveSpots] = useState(0);
  const [processing, setProcessing] = useState(false);
  const price = getPricing(activeSpots);
  const totalSpots = 20;
  const availableSpots = totalSpots - activeSpots;

  useEffect(() => {
    fetchActiveSpots();
  }, []);

  const fetchActiveSpots = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_spots")
        .select("id")
        .eq("is_active", true);

      if (error) throw error;
      setActiveSpots(data?.length || 0);
    } catch (error) {
      console.error("Error fetching active spots:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const handleTestCheckout = () => {
    // Skip payment in test mode
    navigate("/ad-payment-success?test=true");
  };

  const handleCheckout = async () => {
    setProcessing(true);
    // TODO: Integrate with Stripe or payment provider
    toast.info("Payment processing coming soon");
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Advertise on RunStreak</CardTitle>
            <CardDescription>
              Reach thousands of dedicated runners maintaining daily streaks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Pricing</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  ${price}/month
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {availableSpots} of {totalSpots} spots remaining
                </p>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spots 1-5:</span>
                  <span className={activeSpots < 5 ? "font-bold text-green-500" : "line-through opacity-50"}>
                    $299/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spots 6-10:</span>
                  <span className={activeSpots >= 5 && activeSpots < 10 ? "font-bold text-green-500" : activeSpots < 5 ? "" : "line-through opacity-50"}>
                    $399/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spots 11-15:</span>
                  <span className={activeSpots >= 10 && activeSpots < 15 ? "font-bold text-green-500" : activeSpots < 10 ? "" : "line-through opacity-50"}>
                    $599/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final 5 spots:</span>
                  <span className={activeSpots >= 15 ? "font-bold text-green-500" : ""}>
                    $799/month
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">What you get</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Rotating sponsor slot on all pages</li>
                  <li>• Desktop sidebar and mobile banner placement</li>
                  <li>• 10-second rotation for fair visibility</li>
                  <li>• Access to engaged daily runners</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Secure checkout - $${price}/month`
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleTestCheckout}
              >
                Test mode - Skip payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
