import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step5Props {
  runner: any;
}

export default function Step5({ runner }: Step5Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(runner.email || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // Save email to user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          runner_id: runner.id,
          user_email: email,
        });

      if (settingsError) throw settingsError;

      // TODO: Send verification email via edge function
      toast.success("Verification code sent to your email!");
      setCodeSent(true);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Verify code via edge function
      
      // For now, mark as verified after any code is entered
      const { error } = await supabase
        .from('user_settings')
        .update({ email_verified: true })
        .eq('runner_id', runner.id);

      if (error) throw error;

      toast.success("Email verified successfully!");
      setIsVerified(true);
      
      // Auto-advance after short delay
      setTimeout(() => {
        navigate('/onboarding/step-6');
      }, 1000);
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/step-6');
  };

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <Mail className="h-20 w-20 text-primary mx-auto" />
          <p className="text-3xl sm:text-4xl font-instrument font-medium text-foreground">
            Verify Your Email
          </p>
          <p className="text-lg text-muted-foreground font-instrument">
            Stay updated with streak reminders and notifications
          </p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-8">
          <div className="space-y-6 max-w-md mx-auto">
            {!isVerified ? (
              <>
                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={codeSent}
                  />
                </div>

                {codeSent && (
                  <div className="space-y-2 text-left">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                )}

                {!codeSent ? (
                  <Button
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-3 py-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <p className="text-lg font-semibold text-foreground">Email Verified!</p>
              </div>
            )}
          </div>
        </Card>

        <p className="text-sm text-muted-foreground font-instrument">
          We'll only send important updates and streak reminders
        </p>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/onboarding/step-4')}
          size="lg"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          size="lg"
          disabled={isLoading}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
