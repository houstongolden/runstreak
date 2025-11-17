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
import { Smartphone, Apple } from "lucide-react";

export function AppDownloadSection() {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <section className="py-16 px-6 sm:px-8 lg:px-16 xl:px-24">
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
        </div>
      </section>

      {/* Installation Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Add RunStreak to Your Home Screen</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Quick access to your streak stats anytime
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <Smartphone className="h-20 w-20 text-primary" />
            </div>
            
            <div className="space-y-4">
              <p className="text-base sm:text-lg text-center font-medium">
                Save this link as a bookmark on your home screen
              </p>
              
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm sm:text-base text-muted-foreground text-center">
                  Use your browser's menu to add this page to your home screen. 
                  The app will open like a native app with quick access to all your running stats.
                </p>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setShowInstructions(false)}
              size="lg"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
