import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface ActivityKudosProps {
  runnerId: string;
  activityDate: string;
}

export default function ActivityKudos({ runnerId, activityDate }: ActivityKudosProps) {
  const [kudosCount, setKudosCount] = useState(0);
  const [hasGivenKudos, setHasGivenKudos] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentRunnerId = localStorage.getItem('current_runner_id');

  useEffect(() => {
    fetchKudos();
  }, [runnerId, activityDate]);

  const fetchKudos = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_kudos')
        .select('*')
        .eq('runner_id', runnerId)
        .eq('activity_date', activityDate);

      if (error) throw error;

      setKudosCount(data?.length || 0);
      
      if (currentRunnerId) {
        const hasKudos = data?.some(k => k.given_by_runner_id === currentRunnerId);
        setHasGivenKudos(hasKudos || false);
      }
    } catch (error) {
      console.error('Error fetching kudos:', error);
    }
  };

  const toggleKudos = async () => {
    if (!currentRunnerId) {
      toast.error('Please log in to give kudos');
      return;
    }

    if (currentRunnerId === runnerId) {
      toast.error("You can't give kudos to yourself");
      return;
    }

    setLoading(true);
    try {
      if (hasGivenKudos) {
        // Remove kudos
        const { error } = await supabase
          .from('activity_kudos')
          .delete()
          .eq('runner_id', runnerId)
          .eq('activity_date', activityDate)
          .eq('given_by_runner_id', currentRunnerId);

        if (error) throw error;
        
        setKudosCount(prev => prev - 1);
        setHasGivenKudos(false);
        toast.success('Kudos removed');
      } else {
        // Give kudos
        const { error } = await supabase
          .from('activity_kudos')
          .insert({
            runner_id: runnerId,
            activity_date: activityDate,
            given_by_runner_id: currentRunnerId,
          });

        if (error) throw error;
        
        setKudosCount(prev => prev + 1);
        setHasGivenKudos(true);
        toast.success('Kudos given!');
      }
    } catch (error) {
      console.error('Error toggling kudos:', error);
      toast.error('Failed to update kudos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleKudos}
        disabled={loading}
        className={hasGivenKudos ? 'text-red-500 hover:text-red-600' : ''}
      >
        <Heart className={`h-4 w-4 ${hasGivenKudos ? 'fill-current' : ''}`} />
      </Button>
      {kudosCount > 0 && (
        <span className="text-sm text-muted-foreground">{kudosCount}</span>
      )}
    </div>
  );
}
