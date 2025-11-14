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
  const [xProfile, setXProfile] = useState(runner.x_profile || "");
  const [bio, setBio] = useState(runner.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await (supabase as any)
        .from("runners")
        .update({
          x_profile: xProfile,
          bio: bio
        })
        .eq("id", runner.id)
        .select()
        .single();

      if (error) throw error;

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
    setXProfile(runner.x_profile || "");
    setBio(runner.bio || "");
    setIsEditing(false);
  };

  if (!isEditing && !runner.x_profile && !runner.bio) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Add Profile Info
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {isEditing ? (
          <>
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
            {runner.x_profile && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">X Profile</label>
                <a 
                  href={`https://x.com/${runner.x_profile.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block"
                >
                  {runner.x_profile}
                </a>
              </div>
            )}
            {runner.bio && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="text-sm mt-1">{runner.bio}</p>
              </div>
            )}
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
