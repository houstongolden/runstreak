import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function StreakCountdownBanner() {
  const { runnerId } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const difference = midnight.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference,
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLastActivity = async () => {
      if (!runnerId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('runners')
          .select('last_activity_date')
          .eq('id', runnerId)
          .single();

        if (error) throw error;
        setLastActivityDate(data?.last_activity_date || null);
      } catch (error) {
        console.error('Error fetching last activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastActivity();
  }, [runnerId]);

  // Check if user has run today in their local timezone
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const hasRunToday = lastActivityDate === todayStr;
  const isUrgent = timeLeft.total < 3 * 60 * 60 * 1000; // Less than 3 hours

  // Don't show if loading or no runner
  if (loading || !runnerId) {
    return null;
  }

  // Show success state if user has completed their streak today
  if (hasRunToday) {
    return (
      <div className="w-full border-b bg-green-500/10 border-green-500/20">
        <div className="container mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
          <div className="flex items-center justify-center gap-3 py-2.5">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-semibold">
              Congrats! You're good for the day
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Your streak is safe until tomorrow
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show countdown state if user hasn't run today

  return (
    <div 
      className={`w-full border-b ${
        isUrgent 
          ? 'bg-destructive/10 border-destructive/20' 
          : 'bg-orange-500/10 border-orange-500/20'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="flex items-center justify-center gap-4 py-2.5">
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm font-semibold">
              Time to Save Your Streak
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-bold tabular-nums ${
                isUrgent ? 'text-destructive' : 'text-orange-500'
              }`}>
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Hours</span>
            </div>
            
            <span className="text-muted-foreground">:</span>
            
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-bold tabular-nums ${
                isUrgent ? 'text-destructive' : 'text-orange-500'
              }`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Minutes</span>
            </div>
            
            <span className="text-muted-foreground">:</span>
            
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-bold tabular-nums ${
                isUrgent ? 'text-destructive' : 'text-orange-500'
              }`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Seconds</span>
            </div>
          </div>

          <span className="text-sm text-muted-foreground hidden sm:inline">
            Run at least 1 mile before midnight to keep your streak alive
          </span>
        </div>
      </div>
    </div>
  );
}
