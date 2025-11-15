import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const setupAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: { email: 'houston@bamf.ai' }
      });

      if (error) throw error;

      setCompleted(true);
      toast.success('Admin account configured successfully!');
      
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to setup admin account');
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    await supabase.auth.signOut();
    toast.success('Session cleared');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <CardTitle>Admin Setup</CardTitle>
          </div>
          <CardDescription>
            Configure your admin account and test authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!completed ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Setup Admin Account</h3>
                <p className="text-sm text-muted-foreground">
                  This will create/configure the admin user with email: <strong>houston@bamf.ai</strong>
                </p>
                <Button
                  onClick={setupAdmin}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Setting up...' : 'Setup Admin Account'}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Clear Current Session</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of your current session to test the authentication flow
                </p>
                <Button
                  onClick={clearSession}
                  variant="outline"
                  className="w-full"
                >
                  Clear Session
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold">Admin Login Credentials</h3>
                <div className="text-sm space-y-1 bg-secondary/50 p-3 rounded-lg">
                  <p><strong>Email:</strong> houston@bamf.ai</p>
                  <p><strong>Password:</strong> bamf4Life!</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Setup Complete!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
