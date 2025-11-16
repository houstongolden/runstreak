import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CoachSessionHistory from "./CoachSessionHistory";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  source: 'sms' | 'app';
  created_at: string;
  session_id?: string | null;
}

interface AICoachChatProps {
  runnerId: string;
}

export default function AICoachChat({ runnerId }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
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
          // Only add if it matches current session or no session selected
          if (!currentSessionId || newMessage.session_id === currentSessionId) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runnerId, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('coach_messages')
        .select('*')
        .eq('runner_id', runnerId);

      if (currentSessionId) {
        query = query.eq('session_id', currentSessionId);
      } else {
        // If no session selected, get the most recent session's messages
        const { data: sessions } = await supabase
          .from('coaching_sessions')
          .select('id')
          .eq('runner_id', runnerId)
          .order('last_message_at', { ascending: false })
          .limit(1);
        
        if (sessions && sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
          query = query.eq('session_id', sessions[0].id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: true });

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

    try {
      const { data, error } = await supabase.functions.invoke('send-coach-message', {
        body: {
          runner_id: runnerId,
          message: userMessage,
          source: 'app',
          session_id: currentSessionId
        }
      });

      if (error) throw error;

      // Messages will be added via realtime subscription
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewSession}>
            New Session
          </Button>
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
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
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-sm prose-slate dark:prose-invert max-w-none
                      prose-p:my-2 prose-p:leading-relaxed
                      prose-headings:my-3 prose-headings:font-semibold
                      prose-ul:my-2 prose-li:my-1
                      prose-strong:font-semibold prose-strong:text-foreground
                      prose-em:italic prose-em:text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] items-start flex flex-col">
                <div className="px-4 py-2.5 rounded-2xl bg-muted text-foreground rounded-bl-sm">
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Message AI Coach..."
              className="min-h-[52px] max-h-[200px] resize-none pr-12 py-3 text-base border-input focus-visible:ring-1"
              style={{ fontSize: '16px' }}
              disabled={sending}
            />
            <Button 
              type="submit" 
              size="icon"
              className="absolute right-2 bottom-2 h-9 w-9 rounded-full"
              disabled={sending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
