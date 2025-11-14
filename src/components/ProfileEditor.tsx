import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";
import { Runner } from "@/types";

interface ProfileEditorProps {
  runner: Runner;
  onUpdate: (updatedRunner: Runner) => void;
}

export default function ProfileEditor({ runner, onUpdate }: ProfileEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(runner.username || "");
  const [xProfile, setXProfile] = useState(runner.x_profile || "");
  const [bio, setBio] = useState(runner.bio || "");
  const [city, setCity] = useState(runner.city || "");
  const [state, setState] = useState(runner.state || "");
  const [country, setCountry] = useState(runner.country || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate username format (alphanumeric, underscore, hyphen only)
      if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
        toast({
          title: "Invalid Username",
          description: "Username can only contain letters, numbers, underscores, and hyphens.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("runners")
        .update({
          username: username || null,
          x_profile: xProfile,
          bio: bio,
          city: city || null,
          state: state || null,
          country: country || null
        })
        .eq("id", runner.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Username Taken",
            description: "This username is already in use. Please choose another.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setIsSaving(false);
        return;
      }

      onUpdate(data);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
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
    setUsername(runner.username || "");
    setXProfile(runner.x_profile || "");
    setBio(runner.bio || "");
    setCity(runner.city || "");
    setState(runner.state || "");
    setCountry(runner.country || "");
    setIsEditing(false);
  };

  if (!isEditing && !runner.username && !runner.x_profile && !runner.bio && !runner.city && !runner.state && !runner.country) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Strava Info (Read-only) - always show */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">From Strava</h3>
            
            {runner.email && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <p className="text-sm mt-1">{runner.email}</p>
              </div>
            )}
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Strava Display Name</label>
              <p className="text-sm mt-1">{runner.display_name}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Strava Username</label>
              <p className="text-sm mt-1 font-mono">@{runner.strava_username}</p>
            </div>
            
            {runner.athlete_type && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Athlete Type</label>
                <p className="text-sm mt-1 capitalize">{runner.athlete_type}</p>
              </div>
            )}
            
            {runner.created_at_strava && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Member Since</label>
                <p className="text-sm mt-1">
                  {new Date(runner.created_at_strava).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Add Profile Info
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Strava Info (Read-only) */}
        <div className="space-y-4 pb-4 border-b">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">From Strava</h3>
          
          {runner.email && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <p className="text-sm mt-1">{runner.email}</p>
            </div>
          )}
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">Strava Display Name</label>
            <p className="text-sm mt-1">{runner.display_name}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">Strava Username</label>
            <p className="text-sm mt-1 font-mono">@{runner.strava_username}</p>
          </div>
          
          {runner.athlete_type && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Athlete Type</label>
              <p className="text-sm mt-1 capitalize">{runner.athlete_type}</p>
            </div>
          )}
          
          {runner.created_at_strava && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Member Since</label>
              <p className="text-sm mt-1">
                {new Date(runner.created_at_strava).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
          )}
        </div>

        {/* Custom Profile Info (Editable) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase">Custom Profile</h3>
          
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="your-custom-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Your shareable profile URL: runstreak.app/runner/{username || "your-username"}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">X Profile (Twitter)</label>
                <Input
                  placeholder="@username"
                  value={xProfile}
                  onChange={(e) => setXProfile(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  placeholder="Tell us about your running journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
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
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {runner.username && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <p className="text-sm mt-1 font-mono">@{runner.username}</p>
                </div>
              )}
              {runner.x_profile && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">X Profile</label>
                  <a 
                    href={`https://x.com/${runner.x_profile.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block text-sm mt-1"
                  >
                    {runner.x_profile}
                  </a>
                </div>
              )}
              {runner.bio && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bio</label>
                  <p className="text-sm mt-1">{runner.bio}</p>
                </div>
              )}
              {(runner.city || runner.state || runner.country) && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Location</label>
                  <p className="text-sm mt-1">
                    {[runner.city, runner.state, runner.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {!runner.username && !runner.x_profile && !runner.bio && !runner.city && !runner.state && !runner.country && (
                <p className="text-sm text-muted-foreground italic">No custom profile information added yet</p>
              )}
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
