import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Mail, Phone, Sparkles } from "lucide-react";

interface UserSettings {
  id?: string;
  runner_id: string;
  email: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified: boolean;
  ai_coach_enabled: boolean;
  ai_coach_frequency: string;
  ai_coach_time: string;
  ai_coach_style: string;
  free_month_claimed: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    runner_id: "temp-id", // This would come from auth in a real app
    email: "",
    phone_number: "",
    phone_verified: false,
    email_verified: false,
    ai_coach_enabled: false,
    ai_coach_frequency: "daily",
    ai_coach_time: "09:00",
    ai_coach_style: "motivational",
    free_month_claimed: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real app, you'd get the runner_id from authenticated user
      // For now, we'll use a placeholder
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("user_settings")
        .upsert(settings, { onConflict: "runner_id" });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    toast({
      title: "Verification email sent",
      description: "Check your inbox to verify your email address.",
    });
  };

  const handleVerifyPhone = async () => {
    toast({
      title: "Verification SMS sent",
      description: "Check your phone for the verification code.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  const canClaimFreeMonth = settings.email_verified && settings.phone_verified && !settings.free_month_claimed;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your account and AI coach preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Verify your email and phone to unlock features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                  {settings.email_verified ? (
                    <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Button onClick={handleVerifyEmail} variant="outline" size="sm">
                      Verify
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                  {settings.phone_verified ? (
                    <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Button onClick={handleVerifyPhone} variant="outline" size="sm">
                      Verify
                    </Button>
                  )}
                </div>
              </div>

              {canClaimFreeMonth && (
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Congratulations!</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You've verified both email and phone. Claim your free month of AI SMS Coach!
                  </p>
                  <Button
                    onClick={() => {
                      setSettings({ ...settings, free_month_claimed: true });
                      toast({
                        title: "Free month activated!",
                        description: "Enjoy your AI SMS Coach for free for the next 30 days.",
                      });
                    }}
                  >
                    Claim Free Month
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* AI Coach Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI SMS Coach
              </CardTitle>
              <CardDescription>
                Get personalized daily reminders to stay on track with your streak goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-coach-enabled">Enable AI Coach</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive motivational SMS messages
                  </p>
                </div>
                <Switch
                  id="ai-coach-enabled"
                  checked={settings.ai_coach_enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, ai_coach_enabled: checked })
                  }
                  disabled={!settings.phone_verified}
                />
              </div>

              {settings.ai_coach_enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Message Frequency</Label>
                    <Select
                      value={settings.ai_coach_frequency}
                      onValueChange={(value) => 
                        setSettings({ ...settings, ai_coach_frequency: value })
                      }
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="every_other_day">Every Other Day</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Preferred Time</Label>
                    <Select
                      value={settings.ai_coach_time}
                      onValueChange={(value) => 
                        setSettings({ ...settings, ai_coach_time: value })
                      }
                    >
                      <SelectTrigger id="time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">6:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Coaching Style</Label>
                    <Select
                      value={settings.ai_coach_style}
                      onValueChange={(value) => 
                        setSettings({ ...settings, ai_coach_style: value })
                      }
                    >
                      <SelectTrigger id="style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motivational">Motivational</SelectItem>
                        <SelectItem value="accountability">Accountability</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="no_nonsense">No-Nonsense</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the tone that resonates with you
                    </p>
                  </div>
                </>
              )}

              {!settings.phone_verified && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  Verify your phone number above to enable AI SMS Coach
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
