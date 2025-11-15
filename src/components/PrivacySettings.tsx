import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Eye, Users } from "lucide-react";

interface PrivacySettingsProps {
  runnerId: string;
}

export default function PrivacySettings({ runnerId }: PrivacySettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<{
    activity_sharing_mode: 'public' | 'followers' | 'private';
    allow_follow_requests: boolean;
    auto_approve_followers: boolean;
  }>({
    activity_sharing_mode: 'public',
    allow_follow_requests: true,
    auto_approve_followers: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [runnerId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('activity_sharing_mode, allow_follow_requests, auto_approve_followers')
        .eq('runner_id', runnerId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          activity_sharing_mode: data.activity_sharing_mode || 'public',
          allow_follow_requests: data.allow_follow_requests ?? true,
          auto_approve_followers: data.auto_approve_followers ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('runner_id', runnerId);

      if (error) throw error;

      toast({
        title: "Privacy settings saved",
        description: "Your privacy preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Loading privacy settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your activities and follow you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sharing-mode" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Activity Sharing
            </Label>
            <Select
              value={settings.activity_sharing_mode}
              onValueChange={(value) => setSettings({ 
                ...settings, 
                activity_sharing_mode: value as 'public' | 'followers' | 'private' 
              })}
            >
              <SelectTrigger id="sharing-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  Public - Anyone can see your activities
                </SelectItem>
                <SelectItem value="followers">
                  Followers Only - Only approved followers can see your activities
                </SelectItem>
                <SelectItem value="private">
                  Private - Keep all activities private
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {settings.activity_sharing_mode === 'public' && 
                "Your activities will appear in public feeds and be visible to everyone."}
              {settings.activity_sharing_mode === 'followers' && 
                "Only your approved followers will be able to see your activities."}
              {settings.activity_sharing_mode === 'private' && 
                "Your activities will be completely private and only visible to you."}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-follows" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Allow Follow Requests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Other runners can request to follow you
                </p>
              </div>
              <Switch
                id="allow-follows"
                checked={settings.allow_follow_requests}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, allow_follow_requests: checked })
                }
              />
            </div>

            {settings.allow_follow_requests && (
              <div className="flex items-center justify-between pl-8">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-approve">Auto-approve Followers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve all follow requests
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={settings.auto_approve_followers}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_approve_followers: checked })
                  }
                />
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
