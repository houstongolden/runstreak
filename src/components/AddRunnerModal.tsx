import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddRunnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddRunnerModal({
  open,
  onOpenChange,
  onSuccess,
}: AddRunnerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    strava_username: "",
    current_streak_days: "",
    current_streak_miles: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const streakDays = parseInt(formData.current_streak_days);
      const streakMiles = parseFloat(formData.current_streak_miles);
      
      const avgMiles = streakDays > 0 ? streakMiles / streakDays : 0;

      const { error } = await supabase.from("runners").insert([
        {
          display_name: formData.display_name,
          strava_username: formData.strava_username,
          current_streak_days: streakDays,
          current_streak_miles: streakMiles,
          average_miles_per_day: avgMiles,
          longest_streak_ever: streakDays,
          streak_status: "active" as const,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Runner added to the leaderboard.",
      });

      setFormData({
        display_name: "",
        strava_username: "",
        current_streak_days: "",
        current_streak_miles: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding runner:", error);
      toast({
        title: "Error",
        description: "Failed to add runner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Runner (Demo Mode)</DialogTitle>
          <DialogDescription>
            Manually add a runner with test data. In production, runners will connect via Strava OAuth.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                placeholder="John Doe"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="strava_username">Strava Username</Label>
              <Input
                id="strava_username"
                placeholder="johndoe_runs"
                value={formData.strava_username}
                onChange={(e) =>
                  setFormData({ ...formData, strava_username: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="streak_days">Current Streak (Days)</Label>
              <Input
                id="streak_days"
                type="number"
                min="0"
                placeholder="247"
                value={formData.current_streak_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_streak_days: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="streak_miles">Total Miles</Label>
              <Input
                id="streak_miles"
                type="number"
                step="0.1"
                min="0"
                placeholder="1234.5"
                value={formData.current_streak_miles}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_streak_miles: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Runner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
