import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  runner_id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCurrentRunner();
    }
  }, [user]);

  useEffect(() => {
    if (currentRunnerId) {
      fetchConversations();
    }
  }, [currentRunnerId]);

  useEffect(() => {
    if (selectedRunner && currentRunnerId) {
      fetchMessages(selectedRunner.runner_id);
      markMessagesAsRead(selectedRunner.runner_id);
    }
  }, [selectedRunner, currentRunnerId]);

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

  const fetchConversations = async () => {
    if (!currentRunnerId) return;

    try {
      // Get all messages where user is sender or receiver
      const { data: allMessages } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(display_name, avatar_url),
          receiver:receiver_id(display_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentRunnerId},receiver_id.eq.${currentRunnerId}`)
        .order("created_at", { ascending: false });

      if (!allMessages) return;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();

      allMessages.forEach((msg: any) => {
        const partnerId = msg.sender_id === currentRunnerId ? msg.receiver_id : msg.sender_id;
        const partnerData = msg.sender_id === currentRunnerId ? msg.receiver : msg.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            runner_id: partnerId,
            display_name: partnerData.display_name,
            avatar_url: partnerData.avatar_url,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: msg.receiver_id === currentRunnerId && !msg.read ? 1 : 0,
          });
        } else {
          const conv = conversationMap.get(partnerId)!;
          if (msg.receiver_id === currentRunnerId && !msg.read) {
            conv.unread_count++;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!currentRunnerId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentRunnerId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentRunnerId})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as any);
    }
  };

  const markMessagesAsRead = async (partnerId: string) => {
    if (!currentRunnerId) return;

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", currentRunnerId)
      .eq("read", false);

    fetchConversations();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRunner || !currentRunnerId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentRunnerId,
          receiver_id: selectedRunner.runner_id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedRunner.runner_id);
      fetchConversations();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leaderboard
        </Button>
        <h1 className="text-3xl font-instrument font-medium">Inbox</h1>
        <p className="text-muted-foreground">Message runners you follow</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1 p-4">
          <h2 className="font-semibold mb-4">Conversations</h2>
          <ScrollArea className="h-[600px]">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet. Follow someone and start chatting!
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.runner_id}
                  onClick={() => setSelectedRunner(conv)}
                  className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-accent transition-colors ${
                    selectedRunner?.runner_id === conv.runner_id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.avatar_url || ""} />
                      <AvatarFallback>{conv.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.display_name}</p>
                        {conv.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 p-4 flex flex-col">
          {selectedRunner ? (
            <>
              <div className="flex items-center gap-3 pb-4 border-b mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRunner.avatar_url || ""} />
                  <AvatarFallback>{selectedRunner.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedRunner.display_name}</p>
                  <p className="text-xs text-muted-foreground">Mutual follower</p>
                </div>
              </div>

              <ScrollArea className="flex-1 h-[480px] mb-4">
                <div className="space-y-4 pr-4">
                  {messages.map((msg) => {
                    const isSender = msg.sender_id === currentRunnerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isSender
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
