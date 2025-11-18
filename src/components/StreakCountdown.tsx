import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatInTimeZone } from 'date-fns-tz';

interface StreakCountdownProps {
  lastActivityDate?: string | null;
  variant?: "sidebar" | "profile";
  timezone: string;
}

export function StreakCountdown({ lastActivityDate, variant = "profile", timezone }: StreakCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Use date-fns-tz to get current time in runner's timezone
      const runnerTime = new Date();
      const runnerTimeStr = formatInTimeZone(runnerTime, timezone, 'yyyy-MM-dd HH:mm:ss');
      const [datePart, timePart] = runnerTimeStr.split(' ');
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      // Calculate time until midnight in runner's timezone
      const hoursLeft = 23 - hours;
      const minutesLeft = 59 - minutes;
      const secondsLeft = 59 - seconds;
      const totalMilliseconds = (hoursLeft * 3600 + minutesLeft * 60 + secondsLeft) * 1000;
      
      if (totalMilliseconds > 0) {
        setTimeLeft({
          hours: hoursLeft,
          minutes: minutesLeft,
          seconds: secondsLeft,
          total: totalMilliseconds,
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  // Get "today" in the runner's timezone using date-fns-tz
  const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  
  // Calculate yesterday in runner's timezone
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');
  
  const hasRunToday = lastActivityDate === todayStr;
  const hasRunYesterday = lastActivityDate === yesterdayStr;
  
  const isUrgent = timeLeft.total < 3 * 60 * 60 * 1000; // Less than 3 hours

  if (variant === "sidebar") {
    return (
      <div className="px-2 mb-2">
        <Card className={`p-3 border ${isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isUrgent ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Clock className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs font-semibold text-muted-foreground">Streak ends in</span>
          </div>
          <div className="flex items-baseline gap-1 font-instrument">
            <span className={`text-2xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">h</span>
            <span className={`text-2xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">m</span>
            <span className={`text-xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground">s</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Run 1 mile to save it
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Card className={`p-6 border ${isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          ) : (
            <Clock className="h-6 w-6 text-primary" />
          )}
          <h3 className="text-lg font-semibold font-instrument text-foreground">
            {isUrgent ? 'Streak at Risk!' : 'Time to Save Your Streak'}
          </h3>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold font-instrument ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Hours</div>
          </div>
          <span className={`text-3xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>:</span>
          <div className="text-center">
            <div className={`text-4xl font-bold font-instrument ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Minutes</div>
          </div>
          <span className={`text-3xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>:</span>
          <div className="text-center">
            <div className={`text-4xl font-bold font-instrument ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Seconds</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground font-instrument">
          Run at least 1 mile before midnight to keep your streak alive
        </p>
      </div>
    </Card>
  );
}
