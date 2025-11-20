import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileSchema } from "@/lib/validation";

export default function EditProfile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { runnerId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [username, setUsername] = useState("");
  const [xProfile, setXProfile] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [accountabilityNotifications, setAccountabilityNotifications] = useState(true);
  const [stravaFollowPrompt, setStravaFollowPrompt] = useState(true);

  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (!runnerId) {
      navigate("/");
      return;
    }
    fetchProfileData();
  }, [runnerId]);

  const fetchProfileData = async () => {
    try {
      const { data: runner, error: runnerError } = await supabase
        .from("runners")
        .select("*")
        .eq("id", runnerId)
        .single();

      if (runnerError) throw runnerError;

      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("accountability_notifications_enabled, show_strava_follow_prompt")
        .eq("runner_id", runnerId)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      const initialState = {
        username: runner.username || "",
        xProfile: runner.x_profile || "",
        bio: runner.bio || "",
        city: runner.city || "",
        state: runner.state || "",
        country: runner.country || "",
        accountabilityNotifications: settings?.accountability_notifications_enabled ?? true,
        stravaFollowPrompt: settings?.show_strava_follow_prompt ?? true,
      };

      setUsername(initialState.username);
      setXProfile(initialState.xProfile);
      setBio(initialState.bio);
      setCity(initialState.city);
      setState(initialState.state);
      setCountry(initialState.country);
      setAccountabilityNotifications(initialState.accountabilityNotifications);
      setStravaFollowPrompt(initialState.stravaFollowPrompt);
      setInitialData(initialState);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) return;
    
    const changed = 
      username !== initialData.username ||
      xProfile !== initialData.xProfile ||
      bio !== initialData.bio ||
      city !== initialData.city ||
      state !== initialData.state ||
      country !== initialData.country ||
      accountabilityNotifications !== initialData.accountabilityNotifications ||
      stravaFollowPrompt !== initialData.stravaFollowPrompt;
    
    setHasChanges(changed);
  }, [username, xProfile, bio, city, state, country, accountabilityNotifications, stravaFollowPrompt, initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validationResult = profileSchema.safeParse({
        username,
        bio,
        x_profile: xProfile,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const { error: runnerError } = await supabase
        .from("runners")
        .update({
          username: username || null,
          x_profile: xProfile,
          bio: bio,
          city: city || null,
          state: state || null,
          country: country || null
        })
        .eq("id", runnerId);

      if (runnerError) {
        if (runnerError.code === '23505') {
          toast({
            title: "Username Taken",
            description: "This username is already in use. Please choose another.",
            variant: "destructive",
          });
        } else {
          throw runnerError;
        }
        setIsSaving(false);
        return;
      }

      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          runner_id: runnerId,
          accountability_notifications_enabled: accountabilityNotifications,
          show_strava_follow_prompt: stravaFollowPrompt,
        }, { onConflict: 'runner_id' });

      if (settingsError) {
        console.error("Error updating settings:", settingsError);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      setHasChanges(false);
      navigate(`/runner/${username || runnerId}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
      if (!confirm) return;
    }
    navigate(`/runner/${username || runnerId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">
                Update your public profile information
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your-custom-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Your shareable profile URL: runstreaks.io/runner/{username || "your-username"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="xProfile">X Profile (Twitter)</Label>
                <Input
                  id="xProfile"
                  placeholder="@username"
                  value={xProfile}
                  onChange={(e) => setXProfile(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your running journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Input
                    placeholder="State/Province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                  <Input
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social & Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="accountability-notifications">Accountability Partner Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your accountability partners complete their runs
                  </p>
                </div>
                <Switch
                  id="accountability-notifications"
                  checked={accountabilityNotifications}
                  onCheckedChange={setAccountabilityNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="strava-follow-prompt">Strava Follow Prompts</Label>
                  <p className="text-sm text-muted-foreground">
                    Show reminders to follow users on Strava when you follow them here
                  </p>
                </div>
                <Switch
                  id="strava-follow-prompt"
                  checked={stravaFollowPrompt}
                  onCheckedChange={setStravaFollowPrompt}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
