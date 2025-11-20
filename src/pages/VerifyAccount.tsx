import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Mail, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email({ message: "Invalid email address" }).max(255);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number. Use international format (e.g., +1234567890)" });

export default function VerifyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runnerId = searchParams.get('runnerId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);

  // Check if user's email is already verified in Supabase Auth
  useEffect(() => {
    const checkEmailVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && user.email_confirmed_at) {
        setEmail(user.email);
        setEmailAlreadyVerified(true);
        
        // Update runner and user_settings with verified email
        if (runnerId) {
          await supabase
            .from('runners')
            .update({ email: user.email })
            .eq('id', runnerId);
          
          const { data: existingSettings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('runner_id', runnerId)
            .maybeSingle();
          
          if (existingSettings) {
            await supabase
              .from('user_settings')
              .update({ email: user.email, email_verified: true })
              .eq('runner_id', runnerId);
          } else {
            await supabase
              .from('user_settings')
              .insert({
                runner_id: runnerId,
                email: user.email,
                email_verified: true
              });
          }
        }
      }
    };
    checkEmailVerification();
  }, [runnerId]);

  const handleEmailVerification = async () => {
    try {
      // If email is already verified, just navigate to profile
      if (emailAlreadyVerified) {
        toast.success('Email already verified!');
        setTimeout(() => navigate('/'), 1000);
        return;
      }

      // Validate email
      const validatedEmail = emailSchema.parse(email.trim());
      
      setIsLoading(true);

      // Check if user is already logged in (from Strava)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is authenticated via Strava, update their email and send verification
        const { error: updateError } = await supabase.auth.updateUser({
          email: validatedEmail,
        });

        if (updateError) throw updateError;

        toast.success('Verification email sent! Please check your inbox and click the link.');
        setIsLoading(false);
        return;
      }

      // If no session, this shouldn't happen but handle gracefully
      toast.error('Please sign in with Strava first');
      navigate('/strava-connect');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Email verification error:', error);
        toast.error(error.message || 'Failed to send verification email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerification = async () => {
    try {
      // Validate phone
      const validatedPhone = phoneSchema.parse(phone.trim());
      
      setIsLoading(true);

      // Save phone number to user_settings (unverified)
      if (runnerId) {
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('runner_id', runnerId)
          .maybeSingle();

        if (existingSettings) {
          await supabase
            .from('user_settings')
            .update({ phone_number: validatedPhone, phone_verified: false })
            .eq('runner_id', runnerId);
        } else {
          await supabase
            .from('user_settings')
            .insert({
              runner_id: runnerId,
              phone_number: validatedPhone,
              phone_verified: false
            });
        }
      }

      // Send SMS verification code
      const { error: smsError } = await supabase.functions.invoke('send-verification-sms', {
        body: { phoneNumber: validatedPhone, runnerId }
      });

      if (smsError) throw smsError;

      toast.success('Verification code sent to your phone!');
      navigate(`/verify-phone?runnerId=${runnerId}&phone=${encodeURIComponent(validatedPhone)}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Phone verification error:', error);
        toast.error(error.message || 'Failed to send verification code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can verify your account later in settings');
    navigate(`/runner/${runnerId}`);
  };

  if (!runnerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>No runner ID provided</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <Flame className="w-16 h-16 text-primary" />
        </div>
        
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Verify Your Account</h1>
          <p className="text-muted-foreground">
            Verify your email or phone to secure your account and unlock all features
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as "email" | "phone")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    maxLength={255}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification link
                  </p>
                </div>
                <Button
                  onClick={handleEmailVerification}
                  disabled={isLoading || !email}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Verify Email'}
                </Button>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use international format (e.g., +1234567890)
                  </p>
                </div>
                <Button
                  onClick={handlePhoneVerification}
                  disabled={isLoading || !phone}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
