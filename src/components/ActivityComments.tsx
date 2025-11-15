import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";

interface Comment {
  id: string;
  runner_id: string;
  comment_text: string;
  created_at: string;
  runner: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ActivityCommentsProps {
  activityRunnerId: string;
  activityDate: string;
  currentRunnerId?: string;
}

export default function ActivityComments({
  activityRunnerId,
  activityDate,
  currentRunnerId,
}: ActivityCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel(`comments:${activityRunnerId}:${activityDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
          filter: `activity_runner_id=eq.${activityRunnerId},activity_date=eq.${activityDate}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityRunnerId, activityDate]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_comments')
        .select(`
          id,
          runner_id,
          comment_text,
          created_at,
          runner:runners!activity_comments_runner_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('activity_runner_id', activityRunnerId)
        .eq('activity_date', activityDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentRunnerId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('activity_comments')
        .insert({
          runner_id: currentRunnerId,
          activity_runner_id: activityRunnerId,
          activity_date: activityDate,
          comment_text: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-muted-foreground hover:text-foreground"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : 'Add comment'}
      </Button>

      {showComments && (
        <Card className="p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : (
            <>
              {comments.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.runner.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.runner.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {comment.runner.display_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {currentRunnerId === comment.runner_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comment.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{comment.comment_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentRunnerId ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave an encouraging message..."
                    className="min-h-[60px] resize-none"
                    disabled={submitting}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submitting}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sign in to leave a comment
                </p>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
