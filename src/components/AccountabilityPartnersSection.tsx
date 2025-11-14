import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, UserPlus, Loader2, Flame } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Partner {
  id: string;
  status: string;
  requester_id: string;
  partner_id: string;
  created_at: string;
  partner_info?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    current_streak_days: number;
  };
}

interface AccountabilityPartnersSectionProps {
  runnerId: string;
}

export function AccountabilityPartnersSection({ runnerId }: AccountabilityPartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Partner[]>([]);
  const [pendingSent, setPendingSent] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartners();
  }, [runnerId]);

  const fetchPartners = async () => {
    try {
      // Fetch where current user is requester
      const { data: sentData, error: sentError } = await supabase
        .from("accountability_partners")
        .select("*")
        .eq("requester_id", runnerId);

      if (sentError) throw sentError;

      // Fetch where current user is partner
      const { data: receivedData, error: receivedError } = await supabase
        .from("accountability_partners")
        .select("*")
        .eq("partner_id", runnerId);

      if (receivedError) throw receivedError;

      // Combine and fetch partner details
      const allPartnerships = [...(sentData || []), ...(receivedData || [])];
      
      // Get unique partner IDs
      const partnerIds = Array.from(new Set(
        allPartnerships.map(p => p.requester_id === runnerId ? p.partner_id : p.requester_id)
      ));

      // Fetch partner details
      const { data: runnersData, error: runnersError } = await supabase
        .from("runners")
        .select("id, display_name, avatar_url, current_streak_days")
        .in("id", partnerIds);

      if (runnersError) throw runnersError;

      // Map partner info to partnerships
      const partnershipsWithInfo = allPartnerships.map(p => {
        const partnerId = p.requester_id === runnerId ? p.partner_id : p.requester_id;
        const partnerInfo = runnersData?.find(r => r.id === partnerId);
        return { ...p, partner_info: partnerInfo };
      });

      // Sort into categories
      const accepted = partnershipsWithInfo.filter(p => p.status === "accepted");
      const pendingRec = partnershipsWithInfo.filter(
        p => p.status === "pending" && p.partner_id === runnerId
      );
      const pendingSen = partnershipsWithInfo.filter(
        p => p.status === "pending" && p.requester_id === runnerId
      );

      setPartners(accepted);
      setPendingReceived(pendingRec);
      setPendingSent(pendingSen);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to load accountability partners");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (partnershipId: string) => {
    setActionLoading(partnershipId);
    try {
      const { error } = await supabase
        .from("accountability_partners")
        .update({ status: "accepted" })
        .eq("id", partnershipId);

      if (error) throw error;
      
      toast.success("Partnership accepted!");
      fetchPartners();
    } catch (error: any) {
      console.error("Error accepting:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (partnershipId: string) => {
    setActionLoading(partnershipId);
    try {
      const { error } = await supabase
        .from("accountability_partners")
        .update({ status: "declined" })
        .eq("id", partnershipId);

      if (error) throw error;
      
      toast.success("Request declined");
      fetchPartners();
    } catch (error: any) {
      console.error("Error declining:", error);
      toast.error(error.message || "Failed to decline request");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Accountability Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Accountability Partners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Requests Received */}
        {pendingReceived.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Pending Requests
            </h3>
            <div className="space-y-2">
              {pendingReceived.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="h-10 w-10 cursor-pointer"
                      onClick={() => navigate(`/runner/${request.partner_info?.id}`)}
                    >
                      <AvatarImage src={request.partner_info?.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.partner_info?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/runner/${request.partner_info?.id}`)}
                      >
                        {request.partner_info?.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.partner_info?.current_streak_days || 0} day streak
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAccept(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Partners */}
        {partners.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Active Partners
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-br from-primary/5 to-background hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/runner/${partner.partner_info?.id}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={partner.partner_info?.avatar_url || undefined} />
                    <AvatarFallback>
                      {partner.partner_info?.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{partner.partner_info?.display_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="h-3 w-3 text-primary" />
                      {partner.partner_info?.current_streak_days || 0} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Requests Sent
            </h3>
            <div className="space-y-2">
              {pendingSent.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <Avatar 
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => navigate(`/runner/${request.partner_info?.id}`)}
                  >
                    <AvatarImage src={request.partner_info?.avatar_url || undefined} />
                    <AvatarFallback>
                      {request.partner_info?.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p 
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/runner/${request.partner_info?.id}`)}
                    >
                      {request.partner_info?.display_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {partners.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              No accountability partners yet
            </p>
            <p className="text-sm text-muted-foreground">
              Visit other runners' profiles to send partnership requests and stay motivated together!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}