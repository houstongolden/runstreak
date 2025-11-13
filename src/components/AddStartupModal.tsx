import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddStartupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddStartupModal = ({ open, onOpenChange, onSuccess }: AddStartupModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter your Pledge.to restricted API key",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // For MVP, we're just storing the API key
      // In production, you would validate it against Pledge.to API
      const { error } = await supabase
        .from("companies")
        .insert({
          pledge_api_key: apiKey.trim(),
          stripe_api_key: stripeApiKey.trim() || null,
          founder_handle: xHandle.trim() || null,
          // These would be populated from Pledge.to API in production
          name: "New Startup",
          description: "Startup description",
          total_donated: 0,
          arr_donated: 0,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your startup has been added to the leaderboard",
      });

      setApiKey("");
      setStripeApiKey("");
      setXHandle("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding startup:", error);
      toast({
        title: "Error",
        description: "Failed to add startup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add your startup</DialogTitle>
        </DialogHeader>
        
        <p className="text-muted-foreground text-sm mb-4">
          Get a dedicated page on ImpactProof to showcase your startup&apos;s verified donations.
          And nice dofollow backlink 😉
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium">
              Pledge.to restricted API key
            </Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="rk_live_..."
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <a
                href="https://developer.pledge.to/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Click here to create a read-only API key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Scroll down and click "Create key"</li>
              <li>Don't change the permissions</li>
              <li>Don't delete the key or we can't refresh donations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="xHandle" className="text-sm font-medium">
              X handle <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="xHandle"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="username"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripeApiKey" className="text-sm font-medium">
              Stripe API Key <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="stripeApiKey"
              type="password"
              value={stripeApiKey}
              onChange={(e) => setStripeApiKey(e.target.value)}
              placeholder="sk_live_..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              For revenue verification and % donated calculation
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add startup"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
