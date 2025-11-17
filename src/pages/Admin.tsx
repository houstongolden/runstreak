import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Flame, 
  MessageSquare, 
  Search,
  Trash2,
  Shield,
  UserX,
  Megaphone,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/formatters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StravaWebhookManager } from "@/components/StravaWebhookManager";

interface Analytics {
  total_users: number;
  users_last_30_days: number;
  users_last_7_days: number;
  users_today: number;
  total_activities: number;
  activities_last_30_days: number;
  avg_streak_days: number;
  active_streaks: number;
  total_miles: number;
  total_coach_messages: number;
}

interface Runner {
  id: string;
  display_name: string;
  email: string;
  strava_username: string;
  created_at: string;
  current_streak_days: number;
  streak_status: string;
  user_id: string;
}

interface AdSpot {
  id: string;
  company_name: string;
  domain: string;
  description: string;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adSpots, setAdSpots] = useState<AdSpot[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsToggleLoading, setAdsToggleLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  useEffect(() => {
    fetchAnalytics();
    fetchRunners();
    fetchAdSpots();
    fetchAdsEnabled();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_analytics');
      if (error) throw error;
      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const fetchRunners = async () => {
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRunners(data || []);
    } catch (error) {
      console.error('Error fetching runners:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSpots = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_spots')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAdSpots(data || []);
    } catch (error) {
      console.error('Error fetching ad spots:', error);
      toast.error('Failed to load ad spots');
    } finally {
      setAdsLoading(false);
    }
  };

  const fetchAdsEnabled = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'ads_enabled')
        .maybeSingle();

      if (error) throw error;
      setAdsEnabled(data?.setting_value === true);
    } catch (error) {
      console.error('Error fetching ads setting:', error);
    }
  };

  const handleToggleAds = async (enabled: boolean) => {
    setAdsToggleLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: enabled })
        .eq('setting_key', 'ads_enabled');

      if (error) throw error;
      
      setAdsEnabled(enabled);
      toast.success(`Ads ${enabled ? 'enabled' : 'disabled'} globally`);
    } catch (error) {
      console.error('Error toggling ads:', error);
      toast.error('Failed to update ads setting');
    } finally {
      setAdsToggleLoading(false);
    }
  };

  const handleToggleAdSpot = async (spotId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ad_spots')
        .update({ is_active: !currentStatus })
        .eq('id', spotId);

      if (error) throw error;
      
      toast.success(`Ad spot ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchAdSpots();
    } catch (error) {
      console.error('Error toggling ad spot:', error);
      toast.error('Failed to update ad spot');
    }
  };

  const handleDeleteUser = async (runnerId: string, userId: string | null) => {
    try {
      // Delete runner record
      const { error: runnerError } = await supabase
        .from('runners')
        .delete()
        .eq('id', runnerId);

      if (runnerError) throw runnerError;

      // Delete auth user if exists using admin edge function
      if (userId) {
        const { error: authError } = await supabase.functions.invoke('admin-delete-user', {
          body: { userId }
        });
        
        if (authError) {
          console.error('Error deleting auth user:', authError);
          toast.error('Runner deleted but failed to delete auth user');
        }
      }

      toast.success('User deleted successfully');
      fetchRunners();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredRunners = runners.filter(runner =>
    runner.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    runner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    runner.strava_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const conversionRate = analytics 
    ? ((analytics.total_users / Math.max(analytics.total_users + 100, 1)) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your RunStreak application</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          <Badge variant="outline" className="gap-2">
            <Shield className="w-4 h-4" />
            Admin Access
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="ads">Ad Spots</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? formatNumber(analytics.total_users) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analytics?.users_last_7_days || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? formatNumber(analytics.active_streaks) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {analytics?.avg_streak_days?.toFixed(1) || '0'} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics ? formatNumber(analytics.total_activities) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activities_last_30_days || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Visitor to signup
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-semibold">{analytics?.users_today || 0} users</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last 7 days</span>
                  <span className="font-semibold">{analytics?.users_last_7_days || 0} users</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last 30 days</span>
                  <span className="font-semibold">{analytics?.users_last_30_days || 0} users</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Stats</CardTitle>
                <CardDescription>Platform usage metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Miles Logged</span>
                  <span className="font-semibold">
                    {analytics ? formatNumber(analytics.total_miles) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AI Coach Messages</span>
                  <span className="font-semibold">{analytics?.total_coach_messages || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Streak Length</span>
                  <span className="font-semibold">
                    {analytics?.avg_streak_days?.toFixed(1) || '0'} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage registered users</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Strava</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredRunners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRunners.map((runner) => (
                      <TableRow key={runner.id}>
                        <TableCell className="font-medium">{runner.display_name}</TableCell>
                        <TableCell>{runner.email || 'N/A'}</TableCell>
                        <TableCell>{runner.strava_username}</TableCell>
                        <TableCell>
                          <Badge variant={runner.streak_status === 'active' ? 'default' : 'secondary'}>
                            {runner.current_streak_days} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(runner.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {runner.display_name}? This action cannot be undone and will remove all their data including activities, streaks, and messages.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(runner.id, runner.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          {/* Global Ads Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Global Ad Settings</CardTitle>
              <CardDescription>
                Control whether ads are displayed across the entire site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ads-toggle" className="text-base font-medium">
                    Display Ads
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {adsEnabled ? "Ads are currently visible to all users" : "Ads are currently hidden from all users"}
                  </p>
                </div>
                <Switch
                  id="ads-toggle"
                  checked={adsEnabled}
                  onCheckedChange={handleToggleAds}
                  disabled={adsToggleLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ad Spot Management</CardTitle>
              <CardDescription>
                Manage sponsor ads displayed on the leaderboard. Toggle sponsors on/off to control which ads are shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adsLoading ? (
                <div className="text-center py-8">Loading ad spots...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {adSpots.map((spot) => (
                    <Card key={spot.id} className={spot.is_active ? "border-primary" : "opacity-60"}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={`https://logo.clearbit.com/${spot.domain}`}
                              alt={`${spot.company_name} logo`}
                              className="h-10 w-10 object-contain flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-base">{spot.company_name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {spot.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={spot.is_active ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleAdSpot(spot.id, spot.is_active)}
                          >
                            {spot.is_active ? "Active" : "Inactive"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <StravaWebhookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
