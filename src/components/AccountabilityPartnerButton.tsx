import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, HeartOff, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccountabilityPartnerButtonProps {
  targetRunnerId: string;
  targetRunnerName: string;
  currentRunnerId: string | null;
}

type PartnershipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export function AccountabilityPartnerButton({
  targetRunnerId,
  targetRunnerName,
  currentRunnerId,
}: AccountabilityPartnerButtonProps) {
  const [status, setStatus] = useState<PartnershipStatus>("none");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [partnershipId, setPartnershipId] = useState<string | null>(null);

  useEffect(() => {
    checkPartnershipStatus();
  }, [targetRunnerId, currentRunnerId]);

  const checkPartnershipStatus = async () => {
    if (!currentRunnerId || currentRunnerId === targetRunnerId) {
      setLoading(false);
      return;
    }

    try {
      // Check if current user sent request
      const { data: sentRequest } = await supabase
        .from("accountability_partners")
        .select("id, status")
        .eq("requester_id", currentRunnerId)
        .eq("partner_id", targetRunnerId)
        .maybeSingle();

      if (sentRequest) {
        setPartnershipId(sentRequest.id);
        if (sentRequest.status === "accepted") {
          setStatus("accepted");
        } else if (sentRequest.status === "pending") {
          setStatus("pending_sent");
        }
        setLoading(false);
        return;
      }

      // Check if current user received request
      const { data: receivedRequest } = await supabase
        .from("accountability_partners")
        .select("id, status")
        .eq("requester_id", targetRunnerId)
        .eq("partner_id", currentRunnerId)
        .maybeSingle();

      if (receivedRequest) {
        setPartnershipId(receivedRequest.id);
        if (receivedRequest.status === "accepted") {
          setStatus("accepted");
        } else if (receivedRequest.status === "pending") {
          setStatus("pending_received");
        }
      }
    } catch (error) {
      console.error("Error checking partnership status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!currentRunnerId) {
      toast.error("Please connect with Strava first");
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("accountability_partners")
        .insert({
          requester_id: currentRunnerId,
          partner_id: targetRunnerId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      
      setPartnershipId(data.id);
      setStatus("pending_sent");
      setShowDialog(false);
      toast.success(`Accountability partner request sent to ${targetRunnerName}`);
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast.error(error.message || "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!partnershipId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("accountability_partners")
        .update({ status: "accepted" })
        .eq("id", partnershipId);

      if (error) throw error;
      
      setStatus("accepted");
      toast.success(`You're now accountability partners with ${targetRunnerName}!`);
    } catch (error: any) {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!partnershipId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("accountability_partners")
        .delete()
        .eq("id", partnershipId);

      if (error) throw error;
      
      setStatus("none");
      setPartnershipId(null);
      toast.success("Request declined");
    } catch (error: any) {
      console.error("Error declining request:", error);
      toast.error(error.message || "Failed to decline request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePartnership = async () => {
    if (!partnershipId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("accountability_partners")
        .delete()
        .eq("id", partnershipId);

      if (error) throw error;
      
      setStatus("none");
      setPartnershipId(null);
      toast.success("Accountability partnership removed");
    } catch (error: any) {
      console.error("Error removing partnership:", error);
      toast.error(error.message || "Failed to remove partnership");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!currentRunnerId || currentRunnerId === targetRunnerId) {
    return null;
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleAcceptRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Accept Partner Request
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeclineRequest}
          disabled={actionLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemovePartnership}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <HeartOff className="h-4 w-4 mr-2" />
        )}
        Remove Accountability Partner
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2" />
        Request Pending
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowDialog(true)}
      >
        <Heart className="h-4 w-4 mr-2" />
        Request as Accountability Partner
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Accountability Partner Request</DialogTitle>
            <DialogDescription>
              Send a request to {targetRunnerName} to become accountability partners.
              You'll both receive notifications when the other completes their daily run,
              helping you stay motivated and accountable!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
