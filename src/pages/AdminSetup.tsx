import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSetup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupKey, setSetupKey] = useState("");

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { email: email.trim(), password: trimmedPassword, setupKey: setupKey.trim() }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Admin account created successfully!");
      setTimeout(() => navigate("/admin/login"), 1500);
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Failed to create admin account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Admin Setup</CardTitle>
          <CardDescription>
            Create your first admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page is for creating the first admin account. You'll need a setup key for security.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setupKey">Setup Key</Label>
              <Input
                id="setupKey"
                type="password"
                placeholder="Enter setup key"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Set ADMIN_SETUP_KEY environment variable or use default
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/login')}
              className="text-sm"
            >
              Already have an admin account? Sign in
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-sm w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
