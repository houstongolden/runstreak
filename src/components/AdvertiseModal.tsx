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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Advertise on ImpactProof</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Reach thousands of entrepreneurs and founders daily
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">How it works</h3>
            <p className="text-muted-foreground">
              Your startup appears in rotating sponsor slots on desktop sidebars and mobile 
              banners across all ImpactProof pages. Sponsors rotate every 10 seconds to 
              ensure fair visibility.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Availability</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum spots:</span>
                <span className="font-mono">20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current status:</span>
                <span className="text-orange-500 font-semibold">All spots filled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next available:</span>
                <span className="font-mono">1 spot for December</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Lock in your spot</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Pay a <span className="font-bold text-foreground">$999 one-time advance</span> to 
              lock your spot for December. This advance is applied toward your monthly payment.
            </p>
            <div className="text-sm">
              <span className="font-semibold">Monthly rate:</span>{" "}
              <span className="font-mono">$1,499/month</span>{" "}
              <span className="text-muted-foreground">(adjusted based on traffic)</span>
            </div>
          </div>

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => window.open('https://pledge.to/contact', '_blank')}
          >
            Lock spot for December
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
