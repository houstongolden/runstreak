import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Handle phone verification redirect
  useEffect(() => {
    const needsVerification = searchParams.get('verify');
    const runnerId = searchParams.get('runnerId');
    const email = searchParams.get('email');
    
    if (needsVerification === 'phone' && runnerId) {
      toast.info('Please verify your phone number to complete registration');
      navigate(`/verify-phone?runnerId=${runnerId}&email=${email || ''}`);
    }
  }, [searchParams, navigate]);

  const handleStravaConnect = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('strava-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        // Open Strava OAuth in popup window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'stravaAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );
        
        // Listen for message from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'strava-auth-success') {
            popup?.close();
            toast.success('Successfully connected to Strava!');
            if (event.data.runnerId) {
              navigate(`/runner/${event.data.runnerId}`);
            }
            window.removeEventListener('message', messageHandler);
          } else if (event.data.type === 'strava-auth-error') {
            popup?.close();
            toast.error(event.data.message || 'Failed to connect to Strava');
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Fallback if popup is blocked
        if (!popup || popup.closed) {
          window.removeEventListener('message', messageHandler);
          toast.error('Popup was blocked. Please allow popups for this site.');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      toast.error('Failed to initiate Strava connection');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Flame className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your RunStreak account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="strava" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="strava">Strava</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            
            <TabsContent value="strava" className="space-y-4">
              <Button
                onClick={handleStravaConnect}
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                <Flame className="mr-2 h-5 w-5" />
                {isLoading ? 'Connecting...' : 'Connect with Strava'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Sync your runs automatically from Strava
              </p>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? 'Loading...' : 'Sign In'}
                </Button>
              </form>
              <p className="text-sm text-center text-muted-foreground">
                Set up email/password in Settings after connecting Strava
              </p>
            </TabsContent>
          </Tabs>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
