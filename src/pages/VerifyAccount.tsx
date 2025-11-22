import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Mail, Phone, CheckCircle, Loader2 } from "lucide-react";
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

      // Auto-verify: Save email directly to database as verified
      if (runnerId) {
        // Update runners table
        await supabase
          .from('runners')
          .update({ email: validatedEmail })
          .eq('id', runnerId);
        
        // Update or insert into user_settings
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('runner_id', runnerId)
          .maybeSingle();
        
        if (existingSettings) {
          await supabase
            .from('user_settings')
            .update({ email: validatedEmail, email_verified: true })
            .eq('runner_id', runnerId);
        } else {
          await supabase
            .from('user_settings')
            .insert({
              runner_id: runnerId,
              email: validatedEmail,
              email_verified: true
            });
        }
      }

      toast.success('Email verified successfully!');
      setTimeout(() => navigate('/'), 1000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Email verification error:', error);
        toast.error(error.message || 'Failed to verify email');
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
                    disabled={isLoading || emailAlreadyVerified}
                    maxLength={255}
                  />
                  {emailAlreadyVerified ? (
                    <p className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Email verified
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Enter your email to continue
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleEmailVerification}
                  disabled={isLoading || !email || emailAlreadyVerified}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Verifying...' : emailAlreadyVerified ? 'Verified' : 'Verify Email'}
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
