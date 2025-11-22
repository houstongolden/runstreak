import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Mail, Phone, Sparkles, Lock, Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import PrivacySettings from "@/components/PrivacySettings";
import { useAuth } from "@/contexts/AuthContext";
import { settingsSchema, phoneSchema, emailSchema } from "@/lib/validation";

interface UserSettings {
  id?: string;
  runner_id: string;
  email: string; // Strava email or placeholder
  user_email: string; // User-provided email for authentication
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
  const { runnerId: currentRunnerId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingTestMessage, setSendingTestMessage] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    runner_id: currentRunnerId || "", // Use actual runner ID from auth context
    email: "",
    user_email: "",
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
    if (currentRunnerId) {
      fetchSettings();
    }
  }, [currentRunnerId]);

  // Handle custom verification link callback (doesn't touch auth session)
  useEffect(() => {
    const handleVerificationCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const verifyToken = searchParams.get('verify_email');
      const verifyRunnerId = searchParams.get('runner_id');

      if (verifyToken && verifyRunnerId && currentRunnerId === verifyRunnerId) {
        console.log('Email verification link detected...');
        
        // Update database with verified email (no session changes)
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ email_verified: true })
          .eq('runner_id', verifyRunnerId);
        
        if (!updateError) {
          setSettings(prev => ({ ...prev, email_verified: true }));
          
          toast({
            title: "✅ Email verified!",
            description: "Your email has been successfully verified.",
          });
        } else {
          toast({
            title: "Verification failed",
            description: "Could not verify email. Please try again.",
            variant: "destructive",
          });
        }
        
        // Clean up URL without reload
        window.history.replaceState(null, '', window.location.pathname);
        fetchSettings();
      }
    };

    if (currentRunnerId) {
      handleVerificationCallback();
    }
  }, [currentRunnerId]);

  const fetchSettings = async () => {
    try {
      if (!currentRunnerId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('runner_id', currentRunnerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          runner_id: currentRunnerId,
        });
      } else {
        setSettings(prev => ({ ...prev, runner_id: currentRunnerId }));
      }
      
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
    if (!currentRunnerId) {
      toast({
        title: "Error",
        description: "Unable to save settings. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Validate settings data
      const validationResult = settingsSchema.safeParse({
        email: settings.user_email || settings.email, // Use user_email if provided, fallback to Strava email
        phone_number: settings.phone_number,
        ai_coach_frequency: settings.ai_coach_frequency,
        ai_coach_time: settings.ai_coach_time,
        ai_coach_style: settings.ai_coach_style,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

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
    if (!settings.user_email) {
      toast({
        title: "Error",
        description: "Please enter an email address first",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    try {
      emailSchema.parse(settings.user_email);
    } catch (error) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSendingEmailVerification(true);
    try {
      // Special handling for admin email (houston@bamf.com)
      const isAdminEmail = settings.user_email === 'houston@bamf.com';
      
      if (isAdminEmail) {
        // Admin email - just mark as verified in database
        const { error: dbError } = await supabase
          .from('user_settings')
          .upsert({ 
            runner_id: currentRunnerId,
            user_email: settings.user_email,
            email: settings.user_email,
            email_verified: true 
          }, {
            onConflict: 'runner_id'
          });

        if (dbError) throw dbError;

        setSettings(prev => ({ 
          ...prev, 
          user_email: settings.user_email,
          email: settings.user_email,
          email_verified: true 
        }));

        toast({
          title: "✓ Registered and synced with admin profile",
          description: "Restricted one time only.",
        });
        setSendingEmailVerification(false);
        return;
      }

      // Save email to database first (unverified)
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({ 
          runner_id: currentRunnerId,
          user_email: settings.user_email,
          email_verified: false
        }, {
          onConflict: 'runner_id'
        });

      if (saveError) throw saveError;

      // Generate test verification link (doesn't touch auth session)
      const verificationUrl = `${window.location.origin}/settings?verify_email=test_token&runner_id=${currentRunnerId}`;
      
      // For testing: Copy link to clipboard and show in toast
      try {
        await navigator.clipboard.writeText(verificationUrl);
      } catch (e) {
        // Clipboard API might not be available
        console.log('Could not copy to clipboard:', e);
      }
      
      setEmailSent(true);
      toast({
        title: "Test Mode: Email verification link generated",
        description: (
          <div className="space-y-2">
            <p className="text-sm">Click the link below to test verification:</p>
            <a 
              href={verificationUrl} 
              className="text-primary hover:underline block break-all text-xs font-mono bg-muted p-2 rounded"
            >
              {verificationUrl}
            </a>
            <p className="text-xs text-muted-foreground">Link copied to clipboard!</p>
          </div>
        ),
        duration: 15000,
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with +, add +1 for US/Canada
    if (!phone.startsWith('+')) {
      return `+${cleaned.startsWith('1') ? cleaned : '1' + cleaned}`;
    }
    
    return `+${cleaned}`;
  };

  const handleVerifyPhone = async () => {
    if (!settings.phone_number) {
      toast({
        title: "Error",
        description: "Please enter a phone number first",
        variant: "destructive",
      });
      return;
    }

    // Format phone number to E.164
    const formattedPhone = formatPhoneNumber(settings.phone_number);
    
    // Validate E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (e.g., +12025551234 or 2025551234)",
        variant: "destructive",
      });
      return;
    }

    setSendingCode(true);
    try {
      // Save phone number to database first
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({ 
          runner_id: currentRunnerId,
          phone_number: formattedPhone,
          phone_verified: false
        }, {
          onConflict: 'runner_id'
        });

      if (saveError) throw saveError;

      // Use custom Vonage SMS verification edge function
      const { data, error } = await supabase.functions.invoke('send-verification-sms', {
        body: { phoneNumber: formattedPhone }
      });

      console.log("SMS send response:", { data, error });

      if (error) {
        console.error("SMS verification error:", error);
        throw new Error(error.message || "Failed to send verification code");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to send verification code");
      }

      // Update settings with formatted phone
      setSettings({ ...settings, phone_number: formattedPhone });
      setShowCodeInput(true);
      toast({
        title: "Verification code sent",
        description: "Check your phone for the 6-digit code.",
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "SMS Verification Error",
        description: error.message || "Failed to send verification code. Please check your phone number and try again.",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifyingCode(true);
    try {
      // Use custom Vonage SMS verification edge function
      const { data, error } = await supabase.functions.invoke('verify-sms-code', {
        body: { 
          phoneNumber: settings.phone_number,
          code: verificationCode
        }
      });

      if (error || !data?.success) {
        throw new Error("Invalid or expired code");
      }

      // Update user_settings to mark phone as verified
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ 
          phone_verified: true,
          phone_number: settings.phone_number 
        })
        .eq('runner_id', currentRunnerId);

      if (updateError) throw updateError;

      setSettings({ ...settings, phone_verified: true });
      setShowCodeInput(false);
      setVerificationCode("");
      toast({
        title: "Phone verified!",
        description: "Your phone number has been successfully verified.",
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!settings.phone_verified) {
      toast({
        title: "Error",
        description: "Please verify your phone number first",
        variant: "destructive",
      });
      return;
    }

    setSendingTestMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-coach-message", {
        body: { 
          runner_id: settings.runner_id,
          message: "Test message from RunStreaks! Reply to start a conversation with your AI coach.",
          source: 'sms'
        },
      });

      if (error) throw error;

      toast({
        title: "Test message sent!",
        description: "Check your phone for the AI coach message. You can reply to start a conversation.",
      });
    } catch (error) {
      console.error("Error sending test message:", error);
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive",
      });
    } finally {
      setSendingTestMessage(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  const canClaimFreeMonth = false; // Disabled until SMS verification is active

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-instrument font-medium mb-2">Settings</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your account and AI coach preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="shrink-0">
            {saving ? "Saving..." : "Save"}
          </Button>
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
                Verify your email, phone, and update your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user-email">Your Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="user-email"
                    type="email"
                    value={settings.user_email || ""}
                    onChange={(e) => {
                      setSettings({ ...settings, user_email: e.target.value });
                      setEmailSent(false);
                    }}
                    placeholder="your@email.com"
                    disabled={settings.email_verified && !!settings.user_email}
                  />
                  {settings.email_verified && settings.user_email ? (
                    <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Button 
                      onClick={handleVerifyEmail} 
                      variant="outline" 
                      size="sm" 
                      disabled={!settings.user_email || sendingEmailVerification}
                    >
                      {sendingEmailVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {sendingEmailVerification ? "Sending..." : "Verify"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for email/password login and notifications
                </p>
              </div>

              {emailSent && !settings.email_verified && (
                <Alert className="border-orange-500/20 bg-orange-500/10">
                  <Mail className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-2">Verification email sent!</p>
                    <p className="text-muted-foreground">
                      Check your inbox and click the link to verify your email. 
                      The link will automatically verify your account.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 opacity-60">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  Phone Number
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone_number}
                    placeholder="e.g., +12025551234 or 2025551234"
                    disabled={true}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={true}
                  >
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  SMS verification will be available once our compliance campaigns are approved
                </p>
              </div>

              <Separator />

              {/* Password Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword}
                  variant="outline"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
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

          {/* AI Coach Settings - Coming Soon */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI SMS Coach
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
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
                  checked={false}
                  disabled={true}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                SMS features will be available once our compliance campaigns are approved. Stay tuned!
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Privacy Settings */}
          <PrivacySettings runnerId={settings.runner_id} />
        </div>
      </div>
    </div>
  );
}
