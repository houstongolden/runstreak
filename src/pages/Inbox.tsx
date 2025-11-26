import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const [sending, setSending] = useState(false);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentRunnerId) return;

    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentRunnerId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (selectedRunner && (newMsg.sender_id === selectedRunner.runner_id || newMsg.receiver_id === selectedRunner.runner_id)) {
            setMessages(prev => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRunnerId, selectedRunner]);

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

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedRunner || !currentRunnerId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentRunnerId,
          receiver_id: selectedRunner.runner_id,
          content: messageContent,
        });

      if (error) throw error;

      // Messages will be added via realtime or manual fetch
      fetchMessages(selectedRunner.runner_id);
      fetchConversations();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
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
        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 text-foreground font-medium transition-colors hover:text-foreground relative pb-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="relative">
            Back to Leaderboard
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </span>
        </button>
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
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col h-[700px] overflow-hidden">
          {selectedRunner ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedRunner.avatar_url || ""} />
                  <AvatarFallback>{selectedRunner.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedRunner.display_name}</p>
                  <p className="text-xs text-muted-foreground">Mutual follower</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-4">
                      <h2 className="text-xl font-semibold">Start a conversation</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Send a message to {selectedRunner.display_name}
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isSender = msg.sender_id === currentRunnerId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`px-4 py-2.5 rounded-lg ${
                            isSender 
                              ? 'bg-primary text-primary-foreground rounded-br-sm' 
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] items-start flex flex-col">
                        <div className="px-4 py-2.5 rounded-lg bg-muted text-foreground rounded-bl-sm">
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></span>
                            <span className="inline-block w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                            <span className="inline-block w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t bg-card">
                <div className="max-w-3xl mx-auto p-4">
                  <form onSubmit={sendMessage} className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e);
                        }
                      }}
                      placeholder={`Message ${selectedRunner.display_name}...`}
                      className="min-h-[52px] max-h-[200px] resize-none pr-12 py-3 text-base border-input focus-visible:ring-1"
                      style={{ fontSize: '16px' }}
                      disabled={sending}
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      className="absolute right-2 bottom-2 h-9 w-9 rounded-full"
                      disabled={sending || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
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
