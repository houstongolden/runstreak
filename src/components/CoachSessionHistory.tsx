import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Flame } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CoachingSession {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

interface CoachSessionHistoryProps {
  runnerId: string;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function CoachSessionHistory({
  runnerId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}: CoachSessionHistoryProps) {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [runnerId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('runner_id', runnerId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;

    try {
      const { error } = await supabase
        .from('coaching_sessions')
        .delete()
        .eq('id', deleteSessionId);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== deleteSessionId));
      if (currentSessionId === deleteSessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setDeleteSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading sessions...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-background/95">
        {/* Logo at top */}
        <div className="p-4 flex items-center gap-2 border-b">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="font-semibold">RunStreaks</span>
        </div>

        {/* AI Coach section */}
        <div className="p-4 border-b">
          <div className="text-xs text-muted-foreground mb-3 font-medium">AI Coach</div>
          <Button
            onClick={onNewSession}
            variant="outline"
            className="w-full bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20 hover:from-primary/20 hover:to-orange-500/20"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 px-2">
          <div className="text-xs text-muted-foreground mb-2 px-2 mt-2 font-medium">Chat History</div>
          <div className="space-y-0.5 pb-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-muted-foreground">
                No chats yet
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group px-2 py-2 cursor-pointer hover:bg-accent rounded-md transition-colors flex items-center justify-between gap-2 ${
                    currentSessionId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs truncate">
                      {session.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(session.last_message_at), 'MMM d')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteSessionId(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={!!deleteSessionId} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
