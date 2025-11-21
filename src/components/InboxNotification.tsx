import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function InboxNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCurrentRunner();
    }
  }, [user]);

  useEffect(() => {
    if (currentRunnerId) {
      fetchUnreadCount();
      
      // Set up realtime subscription for new messages
      const channel = supabase
        .channel('inbox-notification')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentRunnerId}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${currentRunnerId}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentRunnerId]);

  const fetchCurrentRunner = async () => {
    const { data } = await supabase
      .from("runners")
      .select("id")
      .eq("user_id", user?.id)
      .single();
    
    if (data) {
      setCurrentRunnerId(data.id);
    }
  };

  const fetchUnreadCount = async () => {
    if (!currentRunnerId) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", currentRunnerId)
      .eq("read", false);

    setUnreadCount(count || 0);
  };

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => navigate("/inbox")}
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
