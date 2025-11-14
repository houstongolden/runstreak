import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  source: 'sms' | 'app';
  created_at: string;
}

interface AICoachChatProps {
  runnerId: string;
}

export default function AICoachChat({ runnerId }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('coach-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `runner_id=eq.${runnerId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runnerId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('runner_id', runnerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Only show error if it's an actual database error, not empty results
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setSending(true);
    const userMessage = input.trim();
    setInput("");

    try {
      // Save user message (app source)
      const { error: insertError } = await supabase
        .from('coach_messages')
        .insert({
          runner_id: runnerId,
          content: userMessage,
          role: 'user',
          source: 'app'
        });

      if (insertError) throw insertError;

      // Call edge function to get AI response (app source, not SMS)
      const { data, error } = await supabase.functions.invoke('send-coach-message', {
        body: { 
          runner_id: runnerId,
          message: userMessage,
          source: 'app' // Tell backend this is from app, don't send SMS
        },
      });

      if (error) throw error;

      // AI response is automatically saved by the edge function and will appear via realtime
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">AI Run Streak Coach</h1>
        </div>
      </div>
      
      <ScrollArea ref={scrollRef} className="flex-1 px-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-8 w-8 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
            <p className="text-muted-foreground max-w-md">
              Ask your AI coach anything about your running, training, or goals!
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs opacity-70">{formatTime(message.created_at)}</p>
                    {message.source === 'sms' && (
                      <Badge variant="outline" className="text-xs">SMS</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Ask your coach anything..."
            disabled={sending}
            className="flex-1 bg-background"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || sending}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
