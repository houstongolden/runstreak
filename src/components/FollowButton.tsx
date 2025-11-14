import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetRunnerId: string;
  currentRunnerId: string | null;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
}

export function FollowButton({ targetRunnerId, currentRunnerId, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [targetRunnerId, currentRunnerId]);

  const checkFollowStatus = async () => {
    if (!currentRunnerId || currentRunnerId === targetRunnerId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", currentRunnerId)
        .eq("following_id", targetRunnerId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFollowerCount = async () => {
    const { count } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetRunnerId);
    return count || 0;
  };

  const handleFollow = async () => {
    if (!currentRunnerId) {
      toast.error("Please connect with Strava first");
      return;
    }

    setActionLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentRunnerId)
          .eq("following_id", targetRunnerId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: currentRunnerId,
            following_id: targetRunnerId,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following successfully");
      }

      const newCount = await getFollowerCount();
      onFollowChange?.(isFollowing, newCount);
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Failed to update follow status");
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

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollow}
      disabled={actionLoading}
    >
      {actionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
