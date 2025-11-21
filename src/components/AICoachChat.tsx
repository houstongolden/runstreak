import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isNewSession, setIsNewSession] = useState(searchParams.get('new') === 'true');
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
      } else if (!isNewSession) {
        // Only auto-load most recent session if NOT starting a new session
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
      // If this is a new session and no session ID yet, pass null to create new session
      const sessionIdToUse = isNewSession && !currentSessionId ? null : currentSessionId;
      
      const { data, error } = await supabase.functions.invoke('send-coach-message', {
        body: {
          runner_id: runnerId,
          message: userMessage,
          source: 'app',
          session_id: sessionIdToUse
        }
      });

      if (error) throw error;

      // If this was a new session, mark it as no longer new
      if (isNewSession) {
        setIsNewSession(false);
      }

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
    setIsNewSession(true);
    // Update URL to show new=true parameter
    window.history.replaceState({}, '', `/coach/${runnerId}?new=true`);
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">AI Running Coach</h2>
          <p className="text-xs text-muted-foreground">Your personal training assistant</p>
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
                <div className={`px-4 py-2.5 rounded-lg ${
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
          {/* Conversation Starters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Suggestions</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 animate-accordion-down">
                <button
                  onClick={() => setInput("How's my training going this week?")}
                  className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  How's my training going?
                </button>
                <button
                  onClick={() => setInput("What should I focus on to improve my pace?")}
                  className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  How can I improve my pace?
                </button>
                <button
                  onClick={() => setInput("Analyze my recent runs")}
                  className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Analyze my recent runs
                </button>
              </div>
            )}
          </div>
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
