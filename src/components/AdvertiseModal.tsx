import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AdvertiseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvertiseModal = ({ open, onOpenChange }: AdvertiseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold">Advertise on RunStreak</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Reach thousands of dedicated runners maintaining daily streaks
          </DialogDescription>
        </DialogHeader>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = '/ad-payment-success?test=true'}
        >
          Test mode - Skip to ad setup
        </Button>

        <div className="space-y-4 py-3">
          <div>
            <h3 className="text-lg font-semibold mb-2">How it works</h3>
            <p className="text-sm text-muted-foreground">
              Your brand appears in rotating sponsor slots across all RunStreak pages, rotating every 10 seconds for maximum visibility.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Reach committed athletes</h3>
            <p className="text-sm text-muted-foreground">
              RunStreak users run every single day, invest in quality gear, and obsessively track their performance.
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <h3 className="text-lg font-semibold mb-2">Early bird pricing</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Pricing increases as spots fill up—lock in now for best rate.
            </p>
          </div>

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => window.location.href = '/ad-checkout'}
          >
            Get your spot
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
