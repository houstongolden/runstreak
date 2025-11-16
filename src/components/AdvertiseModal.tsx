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

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">How it works</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your running brand or product appears in rotating sponsor slots on desktop sidebars 
              and mobile banners across all RunStreak pages. Sponsors rotate every 10 seconds to 
              ensure fair visibility to our engaged running community.
            </p>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Reach committed athletes</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-2">
              RunStreak users are highly engaged runners who:
            </p>
            <ul className="text-sm sm:text-base text-muted-foreground space-y-1 list-disc pl-5">
              <li>Run every single day (current streak holders)</li>
              <li>Invest in quality running gear and nutrition</li>
              <li>Track their performance obsessively</li>
              <li>Share their achievements with the community</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Availability</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Maximum spots:</span>
                <span className="font-mono">20</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Current status:</span>
                <span className="text-orange-500 font-semibold">All spots filled</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Next available:</span>
                <span className="font-mono">1 spot for December</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Lock in your spot</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Pay a <span className="font-bold text-foreground">$999 one-time advance</span> to 
              lock your spot for December. This advance is applied toward your monthly payment.
            </p>
            <div className="text-xs sm:text-sm">
              <span className="font-semibold">Monthly rate:</span>{" "}
              <span className="font-mono">$1,499/month</span>{" "}
              <span className="text-muted-foreground block sm:inline mt-1 sm:mt-0">(adjusted based on traffic)</span>
            </div>
          </div>

          <Button 
            className="w-full gap-2 text-sm sm:text-base" 
            size="lg"
            onClick={() => window.open('https://pledge.to/contact', '_blank')}
          >
            Lock spot for December
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
