import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CoachSessionHistory from "./CoachSessionHistory";

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
  const [streamingContent, setStreamingContent] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    const userMessage = input.trim();
    setInput("");

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: 'user',
      source: 'app',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-coach-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          runner_id: runnerId,
          message: userMessage,
          source: 'app'
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setStreamingContent(accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }

      if (accumulatedContent) {
        await supabase.from('coach_messages').insert({
          runner_id: runnerId,
          content: accumulatedContent,
          role: 'assistant',
          source: 'app'
        });
      }

      setStreamingContent("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setSheetOpen(false);
  };

  const handleSessionSelect = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
      setSheetOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Session History */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Running Coach</h1>
            <p className="text-xs text-muted-foreground">Your personal training assistant</p>
          </div>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Chat History</SheetTitle>
            </SheetHeader>
            <CoachSessionHistory
              runnerId={runnerId}
              currentSessionId={currentSessionId || undefined}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">AI Running Coach</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                I'm your personal AI running coach. Ask me about your training, get personalized advice, or chat about your running goals.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-4 py-2 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                🤖
              </div>
              <div className="flex-1 max-w-[80%]">
                <div className="inline-block px-4 py-2 rounded-2xl bg-muted">
                  <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Ask your AI coach anything..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              disabled={sending || !input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
