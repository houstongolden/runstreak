import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
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
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Button
            onClick={onNewSession}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No sessions yet. Start a new conversation!
              </div>
            ) : (
              sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors group ${
                    currentSessionId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <h4 className="text-sm font-medium truncate">
                          {session.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.last_message_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSessionId(session.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this coaching session and all its messages. This action cannot be undone.
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
