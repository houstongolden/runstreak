import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, Trophy, Users, ExternalLink, Sparkles, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Referral {
  id: string;
  referred_runner_id: string | null;
  signup_completed: boolean;
  created_at: string;
  runner?: {
    display_name: string;
    avatar_url: string | null;
    current_streak_days: number | null;
  };
}

interface Prize {
  id: string;
  campaign_name: string;
  prize_description: string;
  prize_value: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface LeaderboardEntry {
  runner_id: string;
  referral_count: number;
  runner: {
    display_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function Invite() {
  const { runnerId } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [editingCode, setEditingCode] = useState(false);
  const [customCode, setCustomCode] = useState<string>("");
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    if (runnerId) {
      fetchReferralData();
      fetchPrizes();
      fetchLeaderboard();
    }
  }, [runnerId]);

  const fetchReferralData = async () => {
    if (!runnerId) return;

    try {
      // Generate or get referral code
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_referral_code',
        { p_runner_id: runnerId }
      );

      if (codeError) throw codeError;
      setReferralCode(codeData);

      // Fetch user's referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_runner_id,
          signup_completed,
          created_at,
          runner:runners!referrals_referred_runner_id_fkey(
            display_name,
            avatar_url,
            current_streak_days
          )
        `)
        .eq('referrer_id', runnerId)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_prizes')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPrizes(data || []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          referrer_id,
          runners!referrals_referrer_id_fkey(
            display_name,
            avatar_url,
            username
          )
        `)
        .eq('signup_completed', true);

      if (error) throw error;

      // Count referrals per runner
      const counts = (data || []).reduce((acc: any, ref: any) => {
        const runnerId = ref.referrer_id;
        if (!acc[runnerId]) {
          acc[runnerId] = {
            runner_id: runnerId,
            referral_count: 0,
            runner: ref.runners
          };
        }
        acc[runnerId].referral_count++;
        return acc;
      }, {});

      const leaderboardData = Object.values(counts)
        .sort((a: any, b: any) => b.referral_count - a.referral_count)
        .slice(0, 10);

      setLeaderboard(leaderboardData as LeaderboardEntry[]);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `https://runstreaks.io/?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const generateInviteMessage = async () => {
    if (!runnerId) return;
    
    setGeneratingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invite-message', {
        body: { runnerId }
      });

      if (error) throw error;
      const referralLink = `https://runstreaks.io/?ref=${referralCode}`;
      const messageWithLink = `${data.message}\n\nJoin me: ${referralLink}`;
      setAiMessage(messageWithLink);
      toast.success('Invite message generated!');
    } catch (error: any) {
      console.error('Error generating message:', error);
      toast.error(error.message || 'Failed to generate invite message');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const copyFullInviteMessage = () => {
    navigator.clipboard.writeText(aiMessage);
    setCopiedMessage(true);
    toast.success('Invite message copied! Ready to share via SMS/WhatsApp');
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const startEditingCode = () => {
    setCustomCode(referralCode);
    setEditingCode(true);
  };

  const cancelEditingCode = () => {
    setCustomCode("");
    setEditingCode(false);
  };

  const saveCustomCode = async () => {
    if (!runnerId || !customCode) return;

    // Validate code format (alphanumeric, 4-20 chars)
    const codeRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!codeRegex.test(customCode)) {
      toast.error('Referral code must be 4-20 alphanumeric characters');
      return;
    }

    setSavingCode(true);
    try {
      // Check if code is already taken
      const { data: existingReferral, error: checkError } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referral_code', customCode.toUpperCase())
        .neq('referrer_id', runnerId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingReferral) {
        toast.error('This referral code is already taken. Try another one.');
        setSavingCode(false);
        return;
      }

      // Update all referrals with this runner's ID to use the new code
      const { error: updateError } = await supabase
        .from('referrals')
        .update({ referral_code: customCode.toUpperCase() })
        .eq('referrer_id', runnerId);

      if (updateError) throw updateError;

      setReferralCode(customCode.toUpperCase());
      setEditingCode(false);
      setCustomCode("");
      toast.success('Referral code updated successfully!');
    } catch (error: any) {
      console.error('Error updating referral code:', error);
      toast.error(error.message || 'Failed to update referral code');
    } finally {
      setSavingCode(false);
    }
  };

  const completedReferrals = referrals.filter(r => r.signup_completed).length;
  const pendingReferrals = referrals.filter(r => !r.signup_completed).length;

  if (loading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Invite Friends</h1>
          <p className="text-muted-foreground">Share RunStreaks and win prizes</p>
        </div>
      </div>

      {/* Active Prizes */}
      {prizes.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Active Giveaways
            </CardTitle>
            <CardDescription>Win prizes by inviting runners to join the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prizes.map((prize) => (
              <div key={prize.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{prize.campaign_name}</h3>
                    <p className="text-sm text-muted-foreground">{prize.prize_description}</p>
                    {prize.prize_value && (
                      <Badge variant="secondary" className="mt-2">
                        {prize.prize_value}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    <div>Ends: {new Date(prize.end_date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Referral Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{referrals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Signups</CardDescription>
            <CardTitle className="text-3xl text-green-600">{completedReferrals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Signups</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{pendingReferrals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* AI Invite Message Generator */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Invite Message Generator
          </CardTitle>
          <CardDescription>
            Generate a personalized invite message based on your running achievements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiMessage ? (
            <Button 
              onClick={generateInviteMessage} 
              disabled={generatingMessage}
              className="w-full"
            >
              {generatingMessage ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Invite Message
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={copyFullInviteMessage}
                  className="flex-1"
                  variant={copiedMessage ? "secondary" : "default"}
                >
                  {copiedMessage ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Full Message
                    </>
                  )}
                </Button>
                <Button 
                  onClick={generateInviteMessage}
                  variant="outline"
                  disabled={generatingMessage}
                >
                  {generatingMessage ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Edit the message above or copy as-is. Your referral link is already included!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link & Code</CardTitle>
          <CardDescription>
            Share this link with your running friends. Customize your code to make it memorable!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
              https://runstreaks.io/?ref={referralCode}
            </div>
            <Button onClick={copyReferralLink} size="icon" variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Your referral code:</p>
              {!editingCode && (
                <Button onClick={startEditingCode} variant="ghost" size="sm">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Customize
                </Button>
              )}
            </div>
            
            {editingCode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="Enter custom code (4-20 chars)"
                    maxLength={20}
                    className="font-mono"
                  />
                  <Button 
                    onClick={saveCustomCode} 
                    size="icon" 
                    disabled={savingCode || customCode.length < 4}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button onClick={cancelEditingCode} size="icon" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  4-20 alphanumeric characters. Make it memorable and on-brand!
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-muted/50 font-mono text-lg font-semibold text-center">
                {referralCode}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Leaderboard
          </CardTitle>
          <CardDescription>Top referrers this month</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referrals yet. Be the first to invite friends!
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.runner_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      index === 1 ? 'bg-gray-400/20 text-gray-600' :
                      index === 2 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    {entry.runner.avatar_url ? (
                      <img
                        src={entry.runner.avatar_url}
                        alt={entry.runner.display_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {entry.runner.display_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{entry.runner.display_name}</div>
                      {entry.runner.username && (
                        <div className="text-xs text-muted-foreground">@{entry.runner.username}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {entry.referral_count} {entry.referral_count === 1 ? 'referral' : 'referrals'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>People you've invited to RunStreaks</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven't invited anyone yet. Share your link above to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  {referral.signup_completed && referral.runner ? (
                    <div className="flex items-center gap-3">
                      {referral.runner.avatar_url ? (
                        <img
                          src={referral.runner.avatar_url}
                          alt={referral.runner.display_name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {referral.runner.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{referral.runner.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Pending signup</div>
                        <div className="text-xs text-muted-foreground">
                          Link clicked {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  <Badge variant={referral.signup_completed ? "default" : "outline"}>
                    {referral.signup_completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
