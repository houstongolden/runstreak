import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Apple, Chrome } from "lucide-react";

export function AppDownloadSection() {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main CTA */}
          <div className="space-y-4">
            <Smartphone className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl sm:text-4xl font-bold">
              Download the App Today
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Add RunStreak to your phone's home screen for quick access to your streak stats
            </p>
            <Button
              size="lg"
              onClick={() => setShowInstructions(true)}
              className="text-lg px-8 py-6"
            >
              Get the App
            </Button>
          </div>

          {/* Platform Badges */}
          <div className="pt-8 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Native Apps Coming Soon
            </p>
            <div className="flex items-center justify-center gap-4">
              <Card className="opacity-60">
                <CardContent className="p-4 flex items-center gap-3">
                  <Apple className="h-8 w-8" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-60">
                <CardContent className="p-4 flex items-center gap-3">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add RunStreak to Your Home Screen</DialogTitle>
            <DialogDescription className="text-base">
              Follow these simple steps to install the app on your phone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* iPhone/Safari Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Apple className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">iPhone (Safari)</h3>
              </div>
              <ol className="space-y-3 pl-4 list-decimal list-inside">
                <li className="text-base">
                  Open RunStreak in <strong>Safari</strong> browser
                </li>
                <li className="text-base">
                  Tap the <strong>Share</strong> button (square with arrow pointing up)
                </li>
                <li className="text-base">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </li>
                <li className="text-base">
                  Tap <strong>"Add"</strong> in the top right corner
                </li>
              </ol>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  Note: This must be done in Safari. If you're using Chrome or another browser, 
                  open this page in Safari first.
                </p>
              </div>
            </div>

            {/* Android/Chrome Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Chrome className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Android (Chrome)</h3>
              </div>
              <ol className="space-y-3 pl-4 list-decimal list-inside">
                <li className="text-base">
                  Open RunStreak in <strong>Chrome</strong> browser
                </li>
                <li className="text-base">
                  Tap the <strong>three dots menu</strong> (⋮) in the top right
                </li>
                <li className="text-base">
                  Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                </li>
                <li className="text-base">
                  Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm
                </li>
              </ol>
            </div>

            {/* What You Get */}
            <div className="bg-primary/5 p-6 rounded-lg space-y-3">
              <h4 className="font-semibold text-lg">What you'll get:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>App icon on your home screen with the RunStreak logo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Quick access to your streak stats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Works just like a native app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>No app store download required</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
