import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyPhone() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const runnerId = searchParams.get('runnerId');
  const email = searchParams.get('email');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Handle magic link auto-login
  useEffect(() => {
    const handleMagicLink = async () => {
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (token && tokenHash && type === 'magiclink') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink',
          });
          
          if (error) {
            console.error('Magic link error:', error);
            toast.error('Failed to authenticate. Please try again.');
          } else {
            toast.success('Successfully authenticated!');
          }
        } catch (error) {
          console.error('Magic link verification error:', error);
        }
      }
    };
    
    handleMagicLink();
  }, [searchParams]);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSendingCode(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-verification-sms', {
        body: { phoneNumber }
      });

      if (error) throw error;
      
      toast.success('Verification code sent to your phone!');
      setShowCodeInput(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    
    try {
      const { error } = await supabase.functions.invoke('verify-sms-code', {
        body: { 
          phoneNumber,
          code 
        }
      });

      if (error) throw error;
      
      // Update user settings with verified phone
      if (runnerId) {
        await supabase
          .from('user_settings')
          .update({ 
            phone_number: phoneNumber,
            phone_verified: true 
          })
          .eq('runner_id', runnerId);
      }
      
      toast.success('Phone verified successfully!');
      
      // Redirect to home with welcome modal
      if (runnerId) {
        navigate(`/?strava=success&runnerId=${runnerId}&welcome=true`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <CardTitle>Verify Your Phone</CardTitle>
          <CardDescription>
            {showCodeInput 
              ? `Enter the 6-digit code sent to ${phoneNumber}`
              : 'Enter your phone number to receive a verification code'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showCodeInput ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              
              <Button
                onClick={handleSendCode}
                disabled={isSendingCode || !phoneNumber}
                className="w-full"
              >
                {isSendingCode ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
                className="w-full"
              >
                {isVerifying ? 'Verifying...' : 'Verify Phone'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive a code?
                </p>
                <Button
                  variant="link"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="p-0 h-auto"
                >
                  {isSendingCode ? 'Sending...' : 'Resend Code'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
